import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, questionPaper, questionPaperItem } from "@/db";
import {
  consumeUsageOrThrow,
  getUserWorkspaceAccess,
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

const isUnsupportedTransactionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /transactions?\s+are\s+not\s+supported/i.test(message);
};

export {
  getQuestionPaperDetail,
  listQuestionPaperSwapCandidates,
  removeQuestionPaperItem,
  reorderQuestionPaperItems,
  swapQuestionPaperItem,
};

export const createQuestionPaper = async (
  userId: string,
  input: CreateQuestionPaperInput & {
    blueprintId?: string | null;
    itemSourcesByQuestionId?: Record<
      string,
      {
        blueprintSectionId?: string | null;
        blueprintSlotId?: string | null;
      }
    >;
  },
) => {
  const access = await getUserWorkspaceAccess(userId);
  const questions = await resolveSelectionQuestions({
    questionIds: input.questionIds,
    count: input.count,
    questionMix: input.questionMix,
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
      buildQuestionPaperItemPayload(
        question,
        index + 1,
        input.itemSourcesByQuestionId?.[question.id],
      ),
    ),
  );

  const totalMarks = itemPayloads.reduce((sum, item) => sum + item.marks, 0);
  const brandAssetId = await resolveBrandAssetForUser(userId, input.brandAssetId);
  const paperValues = {
    userId,
    blueprintId: input.blueprintId ?? null,
    brandAssetId,
    title: input.title.trim(),
    instructions: input.instructions?.trim() || null,
    schoolName: input.schoolName?.trim() || null,
    academicYear: input.academicYear?.trim() || null,
    pdfTemplateKey: input.pdfTemplateKey ?? "default",
    examYearLabel: input.examYearLabel?.trim() || null,
    timeAllowedLabel: input.timeAllowedLabel?.trim() || null,
    departmentLine: input.departmentLine?.trim() || null,
    answerInstructionLine: input.answerInstructionLine?.trim() || null,
    includeAnswerKey: input.includeAnswerKey ?? false,
    gradeId: input.gradeId || null,
    subjectId: input.subjectId || null,
    chapterId: input.chapterId || null,
    subChapterId: input.subChapterId || null,
    totalQuestions: itemPayloads.length,
    totalMarks,
  };
  const itemValues = (paperId: string) =>
    itemPayloads.map((item) => ({
      paperId,
      position: item.position,
      questionId: item.questionId,
      blueprintSectionId: item.blueprintSectionId,
      blueprintSlotId: item.blueprintSlotId,
      questionCode: item.questionCode,
      questionType: item.questionType,
      marks: item.marks,
      swapCount: 0,
      swapLimit: 3,
      renderedBody: item.renderedBody,
      renderedAnswerText: item.renderedAnswerText ?? null,
      renderedOptions: item.renderedOptions,
    }));

  try {
    return await db.transaction(async (tx) => {
      await consumeUsageOrThrow({
        userId,
        field: "paperGenerationsUsed",
        executor: tx,
      });

      const [paperRow] = await tx.insert(questionPaper).values(paperValues).returning();

      if (itemPayloads.length > 0) {
        await tx.insert(questionPaperItem).values(itemValues(paperRow.id));
      }

      return {
        id: paperRow.id,
        title: paperRow.title,
      };
    });
  } catch (error) {
    if (!isUnsupportedTransactionError(error)) {
      throw error;
    }
  }

  const [paperRow] = await db.insert(questionPaper).values(paperValues).returning();

  try {
    if (itemPayloads.length > 0) {
      await db.insert(questionPaperItem).values(itemValues(paperRow.id));
    }

    await consumeUsageOrThrow({
      userId,
      field: "paperGenerationsUsed",
    });
  } catch (error) {
    await db.delete(questionPaper).where(eq(questionPaper.id, paperRow.id));
    throw error;
  }

  return {
    id: paperRow.id,
    title: paperRow.title,
  };
};

export const listQuestionPapers = async (userId: string) => {
  const rows = await db.query.questionPaper.findMany({
    where: eq(questionPaper.userId, userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    with: {
      blueprint: {
        columns: { id: true, title: true, mode: true, status: true },
      },
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
      pdfTemplateKey: paper.pdfTemplateKey,
      examYearLabel: paper.examYearLabel,
      timeAllowedLabel: paper.timeAllowedLabel,
      departmentLine: paper.departmentLine,
      answerInstructionLine: paper.answerInstructionLine,
      totalQuestions: paper.totalQuestions,
      totalMarks: paper.totalMarks,
      schoolName: paper.schoolName,
      academicYear: paper.academicYear,
      blueprint: paper.blueprint,
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
      pdfTemplateKey: input.pdfTemplateKey ?? "default",
      examYearLabel: input.examYearLabel?.trim() || null,
      timeAllowedLabel: input.timeAllowedLabel?.trim() || null,
      departmentLine: input.departmentLine?.trim() || null,
      answerInstructionLine: input.answerInstructionLine?.trim() || null,
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
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      status: true,
      exportedAt: true,
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  if (paper.status !== "finalized") {
    throw new Error("Finalize this paper before downloading the PDF.");
  }

  if (paper.exportedAt) {
    return paper;
  }

  let updated: {
    id: string;
    status: "draft" | "finalized";
    exportedAt: Date | null;
  } | null = null;

  try {
    updated = await db.transaction(async (tx) => {
      const [draftExport] = await tx
        .update(questionPaper)
        .set({
          exportedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(questionPaper.id, paper.id),
            eq(questionPaper.userId, userId),
            isNull(questionPaper.exportedAt),
          ),
        )
        .returning();

      if (!draftExport) {
        return null;
      }

      await consumeUsageOrThrow({
        userId,
        field: "pdfExportsUsed",
        executor: tx,
      });

      return draftExport;
    });
  } catch (error) {
    if (!isUnsupportedTransactionError(error)) {
      throw error;
    }
  }

  if (updated === null) {
    const [draftExport] = await db
      .update(questionPaper)
      .set({
        exportedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(questionPaper.id, paper.id),
          eq(questionPaper.userId, userId),
          isNull(questionPaper.exportedAt),
        ),
      )
      .returning();

    if (draftExport) {
      try {
        await consumeUsageOrThrow({
          userId,
          field: "pdfExportsUsed",
        });
        updated = draftExport;
      } catch (error) {
        await db
          .update(questionPaper)
          .set({
            exportedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(questionPaper.id, paper.id));
        throw error;
      }
    }
  }

  if (updated) {
    return updated;
  }

  const latest = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paper.id), eq(questionPaper.userId, userId)),
    columns: {
      id: true,
      status: true,
      exportedAt: true,
    },
  });

  return latest ?? paper;
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
