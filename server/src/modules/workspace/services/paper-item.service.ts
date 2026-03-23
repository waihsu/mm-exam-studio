import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  db,
  question as questionTable,
  questionPaper,
  questionPaperItem,
} from "@/db";
import {
  assertUsageAvailable,
  getUserWorkspaceAccess,
  incrementUsage,
} from "../../subscriptions/subscription.core";
import {
  buildQuestionPaperItemPayload,
  findPublishedQuestionIds,
  loadPublishedQuestionsByIds,
  toCatalogQuestion,
  type PublishedQuestionRecord,
  type WorkspaceAccessPolicy,
} from "./workspace-shared.service";
import type {
  ReorderQuestionPaperItemsInput,
  SwapQuestionPaperItemInput,
} from "../workspace.schema";
import { getQuestionPaperDetail } from "./paper-detail.service";

const getOwnedDraftQuestionPaper = async (userId: string, paperId: string) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    with: {
      items: {
        orderBy: (table, { asc }) => [asc(table.position)],
        with: {
          question: {
            with: {
              options: {
                columns: {
                  label: true,
                  text: true,
                  isCorrect: true,
                  sortOrder: true,
                },
                orderBy: (table, { asc }) => [asc(table.sortOrder)],
              },
              grade: {
                columns: { id: true, code: true, name: true },
              },
              subject: {
                columns: { id: true, code: true, name: true },
              },
              chapter: {
                columns: { id: true, code: true, name: true, isFreePreview: true },
              },
              subChapter: {
                columns: { id: true, code: true, name: true, isFreePreview: true },
              },
            },
          },
        },
      },
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  if (paper.status !== "draft") {
    throw new Error("Only draft question papers can be changed.");
  }

  return paper;
};

const buildSwapBaseWhere = (params: {
  currentItem: Awaited<ReturnType<typeof getOwnedDraftQuestionPaper>>["items"][number];
}) => [
  eq(questionTable.isPublished, true),
  eq(questionTable.isActive, true),
  eq(questionTable.type, params.currentItem.questionType),
  eq(questionTable.marks, params.currentItem.marks),
  eq(questionTable.gradeId, params.currentItem.question.gradeId),
  eq(questionTable.subjectId, params.currentItem.question.subjectId),
];

const findSwapCandidates = async (params: {
  currentItem: Awaited<ReturnType<typeof getOwnedDraftQuestionPaper>>["items"][number];
  access: WorkspaceAccessPolicy;
  excludedQuestionIds: string[];
  take: number;
}) => {
  const currentQuestion = params.currentItem.question;
  const baseConditions = buildSwapBaseWhere({
    currentItem: params.currentItem,
  });
  const queries = [
    [
      ...baseConditions,
      currentQuestion.chapterId
        ? eq(questionTable.chapterId, currentQuestion.chapterId)
        : isNull(questionTable.chapterId),
      currentQuestion.subChapterId
        ? eq(questionTable.subChapterId, currentQuestion.subChapterId)
        : isNull(questionTable.subChapterId),
    ],
    currentQuestion.chapterId
      ? [...baseConditions, eq(questionTable.chapterId, currentQuestion.chapterId)]
      : baseConditions,
    baseConditions,
  ];

  const results: PublishedQuestionRecord[] = [];
  const seenIds = new Set(params.excludedQuestionIds);
  seenIds.add(currentQuestion.id);

  for (const extraConditions of queries) {
    const remaining = params.take - results.length;
    if (remaining <= 0) {
      break;
    }

    const ids = await findPublishedQuestionIds({
      access: params.access,
      extraConditions,
      excludeIds: Array.from(seenIds),
      limit: remaining,
    });
    const rows = await loadPublishedQuestionsByIds(ids);
    const rowMap = new Map(rows.map((row) => [row.id, row]));

    for (const id of ids) {
      const row = rowMap.get(id);
      if (!row) continue;
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      results.push(row);
    }
  }

  return results;
};

export const reorderQuestionPaperItems = async (
  userId: string,
  paperId: string,
  input: ReorderQuestionPaperItemsInput,
) => {
  const paper = await getOwnedDraftQuestionPaper(userId, paperId);
  const currentIds = paper.items.map((item) => item.id);
  const requestedIds = [...new Set(input.itemIds)];

  if (requestedIds.length !== currentIds.length) {
    throw new Error("Reorder payload must include every paper item exactly once.");
  }

  const currentIdSet = new Set(currentIds);
  if (requestedIds.some((itemId) => !currentIdSet.has(itemId))) {
    throw new Error("Reorder payload contains invalid paper items.");
  }

  for (const [index, itemId] of requestedIds.entries()) {
    await db
      .update(questionPaperItem)
      .set({
        position: -(index + 1),
      })
      .where(eq(questionPaperItem.id, itemId));
  }

  for (const [index, itemId] of requestedIds.entries()) {
    await db
      .update(questionPaperItem)
      .set({
        position: index + 1,
      })
      .where(eq(questionPaperItem.id, itemId));
  }

  return getQuestionPaperDetail(userId, paperId);
};

export const swapQuestionPaperItem = async (
  userId: string,
  paperId: string,
  paperItemId: string,
  input: SwapQuestionPaperItemInput,
) => {
  await assertUsageAvailable({
    userId,
    field: "paperSwapsUsed",
  });

  const access = await getUserWorkspaceAccess(userId);
  const paper = await getOwnedDraftQuestionPaper(userId, paperId);
  const currentItem = paper.items.find((item) => item.id === paperItemId);

  if (!currentItem) {
    throw new Error("Question paper item not found.");
  }

  const usedQuestionIds = paper.items
    .filter((item) => item.id !== paperItemId)
    .map((item) => item.questionId);
  const currentQuestion = currentItem.question;

  if (input.candidateQuestionId && input.candidateQuestionId === currentQuestion.id) {
    throw new Error("Choose a different replacement question to swap.");
  }

  const baseWhere = buildSwapBaseWhere({
    currentItem,
  });

  let nextQuestion: PublishedQuestionRecord | null = null;

  if (input.candidateQuestionId) {
    const [candidateId] = await findPublishedQuestionIds({
      access,
      extraConditions: [...baseWhere, eq(questionTable.id, input.candidateQuestionId)],
      excludeIds: usedQuestionIds,
      limit: 1,
    });
    const rows = candidateId ? await loadPublishedQuestionsByIds([candidateId]) : [];
    nextQuestion = rows[0] ?? null;

    if (!nextQuestion) {
      throw new Error("The selected replacement question is unavailable.");
    }
  } else {
    const swapCandidates = await findSwapCandidates({
      currentItem,
      access,
      excludedQuestionIds: usedQuestionIds,
      take: 1,
    });
    nextQuestion = swapCandidates[0] ?? null;

    if (!nextQuestion) {
      throw new Error("No swap candidate is available for this question yet.");
    }
  }

  const nextPayload = await buildQuestionPaperItemPayload(nextQuestion, currentItem.position);

  await db
    .update(questionPaperItem)
    .set({
      questionId: nextPayload.questionId,
      questionCode: nextPayload.questionCode,
      questionType: nextPayload.questionType,
      marks: nextPayload.marks,
      renderedBody: nextPayload.renderedBody,
      renderedAnswerText: nextPayload.renderedAnswerText,
      renderedOptions: nextPayload.renderedOptions,
    })
    .where(eq(questionPaperItem.id, currentItem.id));

  await incrementUsage({
    userId,
    field: "paperSwapsUsed",
  });

  return getQuestionPaperDetail(userId, paperId);
};

export const listQuestionPaperSwapCandidates = async (
  userId: string,
  paperId: string,
  paperItemId: string,
) => {
  const access = await getUserWorkspaceAccess(userId);
  const paper = await getOwnedDraftQuestionPaper(userId, paperId);
  const currentItem = paper.items.find((item) => item.id === paperItemId);

  if (!currentItem) {
    throw new Error("Question paper item not found.");
  }

  const usedQuestionIds = paper.items
    .filter((item) => item.id !== paperItemId)
    .map((item) => item.questionId);

  const rows = await findSwapCandidates({
    currentItem,
    access,
    excludedQuestionIds: usedQuestionIds,
    take: 6,
  });

  return {
    rows: rows.map((row) => toCatalogQuestion(row)),
  };
};

export const removeQuestionPaperItem = async (
  userId: string,
  paperId: string,
  paperItemId: string,
) => {
  const paper = await getOwnedDraftQuestionPaper(userId, paperId);
  const currentItem = paper.items.find((item) => item.id === paperItemId);

  if (!currentItem) {
    throw new Error("Question paper item not found.");
  }

  await db.delete(questionPaperItem).where(eq(questionPaperItem.id, currentItem.id));

  await db
    .update(questionPaperItem)
    .set({
      position: sql`${questionPaperItem.position} - 1`,
    })
    .where(
      and(
        eq(questionPaperItem.paperId, paper.id),
        gt(questionPaperItem.position, currentItem.position),
      ),
    );

  await db
    .update(questionPaper)
    .set({
      totalQuestions: sql`${questionPaper.totalQuestions} - 1`,
      totalMarks: sql`${questionPaper.totalMarks} - ${currentItem.marks}`,
      updatedAt: new Date(),
    })
    .where(eq(questionPaper.id, paper.id));

  return getQuestionPaperDetail(userId, paperId);
};

