import { and, eq, isNotNull } from "drizzle-orm";
import { db, questionPaper, questionPaperItem } from "@/db";
import {
  assertUsageAvailable,
  getUserWorkspaceAccess,
  incrementUsage,
} from "../../subscriptions/subscription.core";
import { resolveBrandAssetForUser } from "./branding.service";
import { getQuestionPaperDetail } from "./paper-detail.service";
import {
  listQuestionPaperSwapCandidates,
  removeQuestionPaperItem,
  reorderQuestionPaperItems,
  swapQuestionPaperItem,
} from "./paper-item.service";
import {
  assertQuestionSelectionWithinLimit,
  buildQuestionPaperItemPayload,
  resolveSelectionQuestions,
} from "./workspace-shared.service";
import type {
  CreateQuestionPaperInput,
  UpdateQuestionPaperInput,
  UpdateQuestionPaperStatusInput,
} from "../workspace.schema";

export {
  getQuestionPaperDetail,
  listQuestionPaperSwapCandidates,
  removeQuestionPaperItem,
  reorderQuestionPaperItems,
  swapQuestionPaperItem,
};

export const createQuestionPaper = async (
  userId: string,
  input: CreateQuestionPaperInput,
) => {
  await assertUsageAvailable({
    userId,
    field: "paperGenerationsUsed",
  });

  const access = await getUserWorkspaceAccess(userId);
  const questions = await resolveSelectionQuestions({
    questionIds: input.questionIds,
    count: input.count,
    access,
    generatorMode: input.generatorMode,
    filters: {
      search: input.search,
      gradeId: input.gradeId,
      subjectId: input.subjectId,
      chapterId: input.chapterId,
      subChapterId: input.subChapterId,
      questionType: input.questionType,
    },
  });

  assertQuestionSelectionWithinLimit({
    selectedCount: questions.length,
    limit: access.maxQuestionsPerPaper,
    label: "question paper",
  });

  const itemPayloads = await Promise.all(
    questions.map((question, index) =>
      buildQuestionPaperItemPayload(question, index + 1),
    ),
  );

  const totalMarks = itemPayloads.reduce((sum, item) => sum + item.marks, 0);
  const brandAssetId = await resolveBrandAssetForUser(userId, input.brandAssetId);

  const [paperRow] = await db
    .insert(questionPaper)
    .values({
      userId,
      brandAssetId,
      title: input.title.trim(),
      instructions: input.instructions?.trim() || null,
      schoolName: input.schoolName?.trim() || null,
      academicYear: input.academicYear?.trim() || null,
      includeAnswerKey: input.includeAnswerKey ?? false,
      gradeId: input.gradeId || null,
      subjectId: input.subjectId || null,
      chapterId: input.chapterId || null,
      subChapterId: input.subChapterId || null,
      totalQuestions: itemPayloads.length,
      totalMarks,
    })
    .returning();
  const paper = {
    id: paperRow.id,
    title: paperRow.title,
  };

  if (itemPayloads.length > 0) {
    for (const item of itemPayloads) {
      await db.insert(questionPaperItem).values({
        paperId: paper.id,
        position: item.position,
        questionId: item.questionId,
        questionCode: item.questionCode,
        questionType: item.questionType,
        marks: item.marks,
        renderedBody: item.renderedBody,
        renderedAnswerText: item.renderedAnswerText ?? null,
        renderedOptions: item.renderedOptions,
      });
    }
  }

  await incrementUsage({
    userId,
    field: "paperGenerationsUsed",
  });

  return paper;
};

export const listQuestionPapers = async (userId: string) => {
  const rows = await db.query.questionPaper.findMany({
    where: eq(questionPaper.userId, userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    with: {
      grade: {
        columns: { id: true, name: true, code: true },
      },
      subject: {
        columns: { id: true, name: true, code: true },
      },
    },
  });

  return {
    rows: rows.map((paper) => ({
      id: paper.id,
      title: paper.title,
      status: paper.status,
      includeAnswerKey: paper.includeAnswerKey,
      totalQuestions: paper.totalQuestions,
      totalMarks: paper.totalMarks,
      schoolName: paper.schoolName,
      academicYear: paper.academicYear,
      exportedAt: paper.exportedAt,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
      grade: paper.grade,
      subject: paper.subject,
    })),
  };
};

export const updateQuestionPaper = async (
  userId: string,
  paperId: string,
  input: UpdateQuestionPaperInput,
) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      status: true,
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  if (paper.status !== "draft") {
    throw new Error("Move this paper back to draft before editing it.");
  }

  const brandAssetId = await resolveBrandAssetForUser(userId, input.brandAssetId ?? null);

  await db
    .update(questionPaper)
    .set({
      title: input.title.trim(),
      instructions: input.instructions?.trim() || null,
      schoolName: input.schoolName?.trim() || null,
      brandAssetId,
      academicYear: input.academicYear?.trim() || null,
      includeAnswerKey: input.includeAnswerKey ?? false,
      updatedAt: new Date(),
    })
    .where(eq(questionPaper.id, paper.id));

  return getQuestionPaperDetail(userId, paperId);
};

export const updateQuestionPaperStatus = async (
  userId: string,
  paperId: string,
  input: UpdateQuestionPaperStatusInput,
) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      status: true,
      exportedAt: true,
      totalQuestions: true,
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  if (input.status === "finalized") {
    if (paper.totalQuestions < 1) {
      throw new Error("Add at least one question before finalizing this paper.");
    }
  }

  if (input.status === "draft" && paper.exportedAt) {
    throw new Error("This paper has already been exported. Duplicate it to make a new draft.");
  }

  await db
    .update(questionPaper)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(questionPaper.id, paper.id));

  return getQuestionPaperDetail(userId, paperId);
};

export const markQuestionPaperExported = async (userId: string, paperId: string) => {
  await assertUsageAvailable({
    userId,
    field: "pdfExportsUsed",
  });

  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      status: true,
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  if (paper.status !== "finalized") {
    throw new Error("Finalize this paper before downloading the PDF.");
  }

  const [updated] = await db
    .update(questionPaper)
    .set({
      exportedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(questionPaper.id, paper.id))
    .returning();

  await incrementUsage({
    userId,
    field: "pdfExportsUsed",
  });

  return updated;
};

export const deleteQuestionPaper = async (userId: string, paperId: string) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      title: true,
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  await db.delete(questionPaper).where(eq(questionPaper.id, paper.id));

  return {
    id: paper.id,
    title: paper.title,
  };
};

export const listExportedPapers = async (userId: string) => {
  const rows = await db.query.questionPaper.findMany({
    where: and(eq(questionPaper.userId, userId), isNotNull(questionPaper.exportedAt)),
    orderBy: (table, { desc }) => [desc(table.exportedAt)],
    with: {
      grade: {
        columns: { id: true, name: true, code: true },
      },
      subject: {
        columns: { id: true, name: true, code: true },
      },
    },
  });

  return {
    rows: rows.map((paper) => ({
      id: paper.id,
      title: paper.title,
      exportedAt: paper.exportedAt,
      totalQuestions: paper.totalQuestions,
      totalMarks: paper.totalMarks,
      schoolName: paper.schoolName,
      academicYear: paper.academicYear,
      grade: paper.grade,
      subject: paper.subject,
    })),
  };
};
