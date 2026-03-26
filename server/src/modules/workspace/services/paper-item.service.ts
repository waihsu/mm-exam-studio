import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import {
  db,
  question as questionTable,
  questionPaper,
  questionPaperItem,
} from "@/db";
import {
  consumeUsageOrThrow,
  getUserWorkspaceAccess,
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

const isUnsupportedTransactionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /transactions?\s+are\s+not\s+supported/i.test(message);
};

const getOwnedDraftQuestionPaper = async (userId: string, paperId: string) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    with: {
      items: {
        orderBy: (table, { asc }) => [asc(table.position)],
        with: {
          blueprintSection: {
            columns: {
              id: true,
              code: true,
              title: true,
              questionType: true,
              marksPerQuestion: true,
            },
          },
          blueprintSlot: {
            columns: {
              id: true,
              questionType: true,
              marks: true,
              difficultyTarget: true,
              chapterId: true,
              subChapterId: true,
              lockedQuestionId: true,
            },
          },
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

const toQuestionDifficulty = (value: "easy" | "normal" | "hard" | "advance" | null) => {
  if (value === "easy") return "easy";
  if (value === "normal") return "medium";
  if (value === "hard" || value === "advance") return "hard";
  return undefined;
};

const assertBlueprintSwapAllowed = (params: {
  currentItem: Awaited<ReturnType<typeof getOwnedDraftQuestionPaper>>["items"][number];
}) => {
  if (params.currentItem.blueprintSlot?.lockedQuestionId) {
    throw new Error("This question is locked by its blueprint slot and cannot be swapped.");
  }
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

const buildSwapSearchQueries = (params: {
  currentItem: Awaited<ReturnType<typeof getOwnedDraftQuestionPaper>>["items"][number];
}) => {
  const currentQuestion = params.currentItem.question;
  const baseConditions = buildSwapBaseWhere({
    currentItem: params.currentItem,
  });
  const blueprintSlot = params.currentItem.blueprintSlot;
  const blueprintDifficulty = toQuestionDifficulty(blueprintSlot?.difficultyTarget ?? null);

  if (blueprintSlot) {
    return [[
      ...baseConditions,
      blueprintSlot.chapterId
        ? eq(questionTable.chapterId, blueprintSlot.chapterId)
        : undefined,
      blueprintSlot.subChapterId
        ? eq(questionTable.subChapterId, blueprintSlot.subChapterId)
        : undefined,
      blueprintDifficulty ? eq(questionTable.difficulty, blueprintDifficulty) : undefined,
      currentQuestion.swapGroupId
        ? eq(questionTable.swapGroupId, currentQuestion.swapGroupId)
        : undefined,
    ].filter(Boolean)];
  }

  if (currentQuestion.swapGroupId) {
    return [[...baseConditions, eq(questionTable.swapGroupId, currentQuestion.swapGroupId)]];
  }

  return [
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
};

const findSwapCandidates = async (params: {
  currentItem: Awaited<ReturnType<typeof getOwnedDraftQuestionPaper>>["items"][number];
  access: WorkspaceAccessPolicy;
  excludedQuestionIds: string[];
  take: number;
}) => {
  const currentQuestion = params.currentItem.question;
  const queries = buildSwapSearchQueries({
    currentItem: params.currentItem,
  });

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
  const access = await getUserWorkspaceAccess(userId);
  const paper = await getOwnedDraftQuestionPaper(userId, paperId);
  const currentItem = paper.items.find((item) => item.id === paperItemId);

  if (!currentItem) {
    throw new Error("Question paper item not found.");
  }

  assertBlueprintSwapAllowed({
    currentItem,
  });

  if (currentItem.swapCount >= currentItem.swapLimit) {
    throw new Error(
      `This question has already used all ${currentItem.swapLimit} swap attempts.`,
    );
  }

  const usedQuestionIds = paper.items
    .filter((item) => item.id !== paperItemId)
    .map((item) => item.questionId);
  const currentQuestion = currentItem.question;

  if (input.candidateQuestionId && input.candidateQuestionId === currentQuestion.id) {
    throw new Error("Choose a different replacement question to swap.");
  }

  let nextQuestion: PublishedQuestionRecord | null = null;

  if (input.candidateQuestionId) {
    const candidateQuestionId = input.candidateQuestionId;
    const explicitCandidateQueries = buildSwapSearchQueries({
      currentItem,
    }).map((conditions) => [...conditions, eq(questionTable.id, candidateQuestionId)]);

    let candidateId: string | undefined;
    for (const extraConditions of explicitCandidateQueries) {
      const [matchedId] = await findPublishedQuestionIds({
        access,
        extraConditions,
        excludeIds: usedQuestionIds,
        limit: 1,
      });

      if (matchedId) {
        candidateId = matchedId;
        break;
      }
    }

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
  const nextItemValues = {
    questionId: nextPayload.questionId,
    questionCode: nextPayload.questionCode,
    questionType: nextPayload.questionType,
    marks: nextPayload.marks,
    swapCount: sql`${questionPaperItem.swapCount} + 1`,
    renderedBody: nextPayload.renderedBody,
    renderedAnswerText: nextPayload.renderedAnswerText,
    renderedOptions: nextPayload.renderedOptions,
  };

  try {
    await db.transaction(async (tx) => {
      await consumeUsageOrThrow({
        userId,
        field: "paperSwapsUsed",
        executor: tx,
      });

      const [updatedItem] = await tx
        .update(questionPaperItem)
        .set(nextItemValues)
        .where(
          and(
            eq(questionPaperItem.id, currentItem.id),
            lt(questionPaperItem.swapCount, currentItem.swapLimit),
          ),
        )
        .returning();

      if (!updatedItem) {
        throw new Error(
          `This question has already used all ${currentItem.swapLimit} swap attempts.`,
        );
      }
    });
  } catch (error) {
    if (!isUnsupportedTransactionError(error)) {
      throw error;
    }

    const [updatedItem] = await db
      .update(questionPaperItem)
      .set(nextItemValues)
      .where(
        and(
          eq(questionPaperItem.id, currentItem.id),
          lt(questionPaperItem.swapCount, currentItem.swapLimit),
        ),
      )
      .returning();

    if (!updatedItem) {
      throw new Error(
        `This question has already used all ${currentItem.swapLimit} swap attempts.`,
      );
    }

    try {
      await consumeUsageOrThrow({
        userId,
        field: "paperSwapsUsed",
      });
    } catch (usageError) {
      await db
        .update(questionPaperItem)
        .set({
          questionId: currentItem.questionId,
          questionCode: currentItem.questionCode,
          questionType: currentItem.questionType,
          marks: currentItem.marks,
          swapCount: currentItem.swapCount,
          renderedBody: currentItem.renderedBody,
          renderedAnswerText: currentItem.renderedAnswerText,
          renderedOptions: currentItem.renderedOptions,
        })
        .where(eq(questionPaperItem.id, currentItem.id));
      throw usageError;
    }
  }

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

  if (currentItem.blueprintSlot?.lockedQuestionId) {
    return {
      rows: [],
    };
  }

  if (currentItem.swapCount >= currentItem.swapLimit) {
    return {
      rows: [],
    };
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
