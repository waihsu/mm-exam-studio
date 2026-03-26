import { and, eq, ne } from "drizzle-orm";
import { chapter, db, gradeSubject, question, subChapter } from "@/db";
import type {
  CreateQuestionInput,
  QuestionParametricValueSetInput,
  QuestionVariableInput,
} from "../question.schema";

export type QuestionReviewStatus = "draft" | "in_review" | "needs_changes" | "approved";

export const toVariableDefinitions = (
  value: unknown,
): QuestionVariableInput[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as QuestionVariableInput[];
};

export const toQuestionImageUrls = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (!normalized.length) {
    return undefined;
  }

  return [...new Set(normalized)].slice(0, 4);
};

export const toParametricValueSets = (
  value: unknown,
): QuestionParametricValueSetInput[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as QuestionParametricValueSetInput[];
};

const ensureGradeSubjectLink = async (gradeId: string, subjectId: string) => {
  const linkedGradeSubject = await db.query.gradeSubject.findFirst({
    where: and(
      eq(gradeSubject.gradeId, gradeId),
      eq(gradeSubject.subjectId, subjectId),
    ),
    columns: {
      isActive: true,
    },
  });

  if (!linkedGradeSubject) {
    throw new Error("Selected subject is not linked to the selected grade.");
  }

  if (!linkedGradeSubject.isActive) {
    throw new Error("Selected grade and subject link is inactive.");
  }
};

const ensureChapterMatches = async (params: {
  gradeId: string;
  subjectId: string;
  chapterId?: string | null;
}) => {
  if (!params.chapterId) {
    return null;
  }

  const chapterRecord = await db.query.chapter.findFirst({
    where: eq(chapter.id, params.chapterId),
    columns: {
      id: true,
      gradeId: true,
      subjectId: true,
      isActive: true,
    },
  });

  if (!chapterRecord) {
    throw new Error("Selected chapter was not found.");
  }

  if (!chapterRecord.isActive) {
    throw new Error("Selected chapter is inactive.");
  }

  if (
    chapterRecord.gradeId !== params.gradeId ||
    chapterRecord.subjectId !== params.subjectId
  ) {
    throw new Error(
      "Selected chapter does not belong to the selected grade and subject.",
    );
  }

  return chapterRecord;
};

const ensureSubChapterMatches = async (params: {
  chapterId?: string | null;
  subChapterId?: string | null;
}) => {
  if (!params.subChapterId) {
    return;
  }

  if (!params.chapterId) {
    throw new Error("Select a chapter before choosing a sub chapter.");
  }

  const subChapterRecord = await db.query.subChapter.findFirst({
    where: eq(subChapter.id, params.subChapterId),
    columns: {
      chapterId: true,
      isActive: true,
    },
  });

  if (!subChapterRecord) {
    throw new Error("Selected sub chapter was not found.");
  }

  if (!subChapterRecord.isActive) {
    throw new Error("Selected sub chapter is inactive.");
  }

  if (subChapterRecord.chapterId !== params.chapterId) {
    throw new Error(
      "Selected sub chapter does not belong to the selected chapter.",
    );
  }
};

export const validateQuestionRelations = async (params: {
  gradeId: string;
  subjectId: string;
  chapterId?: string | null;
  subChapterId?: string | null;
}) => {
  await ensureGradeSubjectLink(params.gradeId, params.subjectId);
  const chapterRecord = await ensureChapterMatches(params);
  await ensureSubChapterMatches({
    chapterId: chapterRecord?.id ?? params.chapterId,
    subChapterId: params.subChapterId,
  });
};

export const assertPublishState = (params: {
  isPublished?: boolean;
  reviewStatus?: QuestionReviewStatus;
}) => {
  if (params.isPublished && params.reviewStatus !== "approved") {
    throw new Error("Only approved questions can be published.");
  }
};

export const validateStructuredQuestionData = (
  params: Pick<
    CreateQuestionInput,
    | "mode"
    | "swapGroupId"
    | "variationNumber"
    | "parametricValueSets"
    | "questionImageUrls"
    | "solutionImageUrls"
  >,
) => {
  const hasSwapGroupId = Boolean(params.swapGroupId?.trim());
  const hasVariationNumber = typeof params.variationNumber === "number";

  if (hasSwapGroupId !== hasVariationNumber) {
    throw new Error(
      "Swap-enabled questions need both a swap group ID and a variation number.",
    );
  }

  if (params.mode === "static" && (params.parametricValueSets?.length ?? 0) > 0) {
    throw new Error("Static questions cannot include parametric value sets.");
  }

  if ((params.questionImageUrls?.length ?? 0) > 4) {
    throw new Error("Question content supports up to 4 images.");
  }

  if ((params.solutionImageUrls?.length ?? 0) > 4) {
    throw new Error("Solution content supports up to 4 images.");
  }
};

export const normalizeReviewStatus = (params: {
  isPublished: boolean;
  reviewStatus?: QuestionReviewStatus;
  fallback: QuestionReviewStatus;
}) => {
  if (params.isPublished) {
    return params.reviewStatus ?? "approved";
  }
  return params.reviewStatus ?? params.fallback;
};

export const toQuestionOptionsInput = (input: {
  options: {
    label: string | null;
    text: string;
    isCorrect: boolean;
  }[];
}) =>
  input.options.map((option) => ({
    label: option.label ?? undefined,
    text: option.text,
    isCorrect: option.isCorrect,
  })) satisfies CreateQuestionInput["options"];

export const assertSwapGroupVariationIntegrity = async (params: {
  questionId?: string;
  swapGroupId?: string | null;
  variationNumber?: number | null;
  gradeId: string;
  subjectId: string;
  type: CreateQuestionInput["type"];
  marks: number;
}) => {
  const swapGroupId = params.swapGroupId?.trim();
  if (!swapGroupId || typeof params.variationNumber !== "number") {
    return;
  }

  const groupQuestions = await db.query.question.findMany({
    where: and(
      eq(question.swapGroupId, swapGroupId),
      params.questionId ? ne(question.id, params.questionId) : undefined,
    ),
    columns: {
      id: true,
      variationNumber: true,
      gradeId: true,
      subjectId: true,
      type: true,
      marks: true,
    },
  });

  if (groupQuestions.length >= 3) {
    throw new Error(
      "Swap group already has 3 variants. Use a different swap group ID.",
    );
  }

  if (
    groupQuestions.some(
      (item) => item.variationNumber === params.variationNumber,
    )
  ) {
    throw new Error(
      `Variation number ${params.variationNumber} already exists in this swap group.`,
    );
  }

  if (groupQuestions.some((item) => typeof item.variationNumber !== "number")) {
    throw new Error(
      "Swap group contains invalid legacy records without variation numbers.",
    );
  }

  const incompatibleQuestion = groupQuestions.find(
    (item) =>
      item.gradeId !== params.gradeId ||
      item.subjectId !== params.subjectId ||
      item.type !== params.type ||
      item.marks !== params.marks,
  );

  if (incompatibleQuestion) {
    throw new Error(
      "Swap group questions must share the same grade, subject, type, and marks.",
    );
  }
};
