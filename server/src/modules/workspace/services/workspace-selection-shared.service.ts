import {
  and,
  count as dbCount,
  eq,
  gte,
  inArray,
} from "drizzle-orm";
import {
  db,
  practiceSession,
  question as questionTable,
} from "@/db";
import { formatMatchingPairs } from "../utils/matching-answer";
import { type RenderedOption } from "../workspace.mapper";
import {
  findPublishedQuestionIds,
  loadPublishedQuestionsByIds,
  unavailableQuestionsMessageForPlan,
  type CatalogFilters,
  type PublishedQuestionRecord,
  type WorkspaceAccessPolicy,
} from "./workspace-catalog-shared.service";
import { previewQuestion } from "../../questions/services/question-preview.service";

export const previewQuestionForWorkspace = async (
  payload: Parameters<typeof previewQuestion>[0],
) => {
  return previewQuestion(payload);
};

export const buildPreviewPayload = (question: PublishedQuestionRecord) => ({
  questionCode: question.questionCode,
  body: question.body,
  type: question.type,
  difficulty: question.difficulty,
  mode: question.mode,
  reviewStatus: question.reviewStatus,
  reviewNotes: question.reviewNotes,
  gradeId: question.gradeId,
  subjectId: question.subjectId,
  chapterId: question.chapterId,
  subChapterId: question.subChapterId,
  explanation: question.explanation,
  answerText: question.answerText,
  answerFormula: question.answerFormula,
  variablesSchema: Array.isArray(question.variablesSchema)
    ? (question.variablesSchema as Array<{
        key: string;
        label?: string;
        type: "number" | "text";
        min?: number;
        max?: number;
        step?: number;
        choices?: string[];
      }>)
    : undefined,
  parametricValueSets: Array.isArray(question.parametricValueSets)
    ? (question.parametricValueSets as Array<Record<string, string | number>>)
    : undefined,
  isPublished: question.isPublished,
  marks: question.marks,
  options: question.options.map((option) => ({
    label: option.label ?? undefined,
    text: option.text,
    isCorrect: option.isCorrect,
  })),
});

export const deriveCorrectAnswerText = (
  questionType: PublishedQuestionRecord["type"],
  options: RenderedOption[],
  answerText?: string | null,
) => {
  if (questionType === "matching") {
    const matchingPairs = options.reduce<Record<string, string>>((pairs, option, index) => {
      const left = option.label?.trim() || `Item ${index + 1}`;
      const right = option.text.trim();
      if (!left || !right) return pairs;
      pairs[left] = right;
      return pairs;
    }, {});

    const displayText = formatMatchingPairs(matchingPairs);
    return displayText.length > 0 ? displayText : answerText ?? null;
  }

  const correctOptionValues = options
    .filter((option) => option.isCorrect)
    .map((option) => option.label?.trim() || option.text.trim())
    .filter(Boolean);

  if (correctOptionValues.length > 0) {
    return correctOptionValues.join(", ");
  }

  return answerText ?? null;
};

export const assertQuestionSelectionWithinLimit = (params: {
  selectedCount: number;
  limit: number | null;
  label: "practice session" | "question paper";
}) => {
  if (typeof params.limit !== "number") return;

  if (params.selectedCount > params.limit) {
    throw new Error(
      `Your current plan allows up to ${params.limit} questions in one ${params.label}.`,
    );
  }
};

const DAILY_PRACTICE_SESSION_LIMIT_BY_PLAN: Record<WorkspaceAccessPolicy["planCode"], number | null> = {
  free: 8,
  pro: 60,
  premium: null,
};

const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const getDailyPracticeSessionLimit = (planCode: WorkspaceAccessPolicy["planCode"]) =>
  DAILY_PRACTICE_SESSION_LIMIT_BY_PLAN[planCode];

export const assertPracticeSessionQuota = async (params: {
  userId: string;
  access: WorkspaceAccessPolicy;
}) => {
  const dailyLimit = getDailyPracticeSessionLimit(params.access.planCode);
  if (typeof dailyLimit !== "number") {
    return;
  }

  const todayStart = startOfUtcDay();
  const usedToday = await db
    .select({ total: dbCount() })
    .from(practiceSession)
    .where(
      and(
        eq(practiceSession.userId, params.userId),
        gte(practiceSession.startedAt, todayStart),
      ),
    )
    .then((rows) => rows[0]?.total ?? 0);

  if (usedToday >= dailyLimit) {
    throw new Error(
      "Daily practice session limit reached for your current plan. Please try again tomorrow.",
    );
  }
};

export const buildQuestionPaperItemPayload = async (
  question: PublishedQuestionRecord,
  position: number,
  source?: {
    blueprintSectionId?: string | null;
    blueprintSlotId?: string | null;
  },
) => {
  const preview = await previewQuestionForWorkspace(buildPreviewPayload(question));
  const renderedOptions = preview.options.map((option) => ({
    label: option.label ?? null,
    text: option.text,
    isCorrect: option.isCorrect,
  }));

  return {
    position,
    questionId: question.id,
    blueprintSectionId: source?.blueprintSectionId ?? null,
    blueprintSlotId: source?.blueprintSlotId ?? null,
    questionCode: question.questionCode,
    questionType: question.type,
    marks: question.marks,
    renderedBody: preview.body,
    renderedAnswerText: deriveCorrectAnswerText(
      question.type,
      renderedOptions,
      preview.answerText,
    ),
    renderedOptions,
  };
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const resolveSelectionQuestions = async (params: {
  questionIds?: string[];
  count?: number;
  questionMix?: Array<{
    questionType: CatalogFilters["questionType"];
    count: number;
  }>;
  filters: CatalogFilters;
  access?: WorkspaceAccessPolicy;
  generatorMode?: "all_questions" | "mcq_only";
}) => {
  const selectionFilters: CatalogFilters = {
    ...params.filters,
    questionType:
      params.generatorMode === "mcq_only"
        ? "mcq"
        : params.filters.questionType,
  };

  const questionIds = [...new Set(params.questionIds?.filter(Boolean) ?? [])];

  if (questionIds.length > 0) {
    const matchedIds = await findPublishedQuestionIds({
      access: params.access,
      extraConditions: [inArray(questionTable.id, questionIds)],
      limit: questionIds.length,
    });
    const rows = await loadPublishedQuestionsByIds(matchedIds);

    if (rows.length !== questionIds.length) {
      throw new Error(unavailableQuestionsMessageForPlan(params.access));
    }

    const rowMap = new Map(rows.map((row) => [row.id, row]));
    return questionIds.map((id) => rowMap.get(id)).filter(Boolean) as PublishedQuestionRecord[];
  }

  const questionMix = params.questionMix?.filter(
    (entry): entry is NonNullable<typeof params.questionMix>[number] =>
      Boolean(entry.questionType) && Number.isFinite(entry.count) && entry.count > 0,
  ) ?? [];

  if (questionMix.length > 0) {
    const selectedIds: string[] = [];

    for (const entry of questionMix) {
      const questionType = entry.questionType as NonNullable<CatalogFilters["questionType"]>;
      const ids = await findPublishedQuestionIds({
        filters: {
          ...selectionFilters,
          questionType,
        },
        access: params.access,
        excludeIds: selectedIds,
        limit: Math.max(entry.count * 6, entry.count),
      });

      const pool = await loadPublishedQuestionsByIds(ids);
      if (pool.length < entry.count) {
        throw new Error(
          `Not enough ${questionType.replaceAll("_", " ")} questions matched your current filters.`,
        );
      }

      const picked = shuffle(pool).slice(0, entry.count);
      selectedIds.push(...picked.map((item) => item.id));
    }

    const rows = await loadPublishedQuestionsByIds(selectedIds);
    const rowMap = new Map(rows.map((row) => [row.id, row]));
    return selectedIds
      .map((id) => rowMap.get(id))
      .filter(Boolean) as PublishedQuestionRecord[];
  }

  const count = Math.max(1, Math.min(50, params.count ?? 10));
  const ids = await findPublishedQuestionIds({
    filters: selectionFilters,
    access: params.access,
    limit: Math.max(count * 4, count),
  });
  const pool = await loadPublishedQuestionsByIds(ids);

  if (pool.length === 0) {
    throw new Error("No published questions matched your filters.");
  }

  return shuffle(pool).slice(0, Math.min(count, pool.length));
};
