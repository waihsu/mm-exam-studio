import type { CreateQuestionInput } from "./question.schema";

const normalizeQuestionMediaUrls = (value: readonly string[] | undefined) => {
  if (!value?.length) {
    return null;
  }

  const normalized = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (!normalized.length) {
    return null;
  }

  return [...new Set(normalized)].slice(0, 4);
};

export const toStoredQuestionData = (
  data: Pick<
    CreateQuestionInput,
    | "questionCode"
    | "body"
    | "type"
    | "difficulty"
    | "mode"
    | "swapGroupId"
    | "variationNumber"
    | "reviewStatus"
    | "reviewNotes"
    | "gradeId"
    | "subjectId"
    | "chapterId"
    | "subChapterId"
    | "questionTopText"
    | "questionBottomText"
    | "questionImageUrls"
    | "explanation"
    | "solutionTopText"
    | "solutionBottomText"
    | "solutionImageUrls"
    | "answerText"
    | "answerFormula"
    | "variablesSchema"
    | "parametricValueSets"
    | "variantContents"
    | "isPublished"
    | "marks"
  >,
  createdBy?: string,
  reviewMetadata?: {
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
  },
) => ({
  questionCode: data.questionCode,
  body: data.body,
  type: data.type,
  difficulty: data.difficulty,
  mode: data.mode,
  swapGroupId: data.swapGroupId?.trim() || null,
  variationNumber: data.variationNumber ?? null,
  reviewStatus:
    data.isPublished ? (data.reviewStatus ?? "approved") : (data.reviewStatus ?? "draft"),
  reviewNotes: data.reviewNotes,
  gradeId: data.gradeId,
  subjectId: data.subjectId,
  chapterId: data.chapterId,
  subChapterId: data.subChapterId,
  questionTopText: data.questionTopText ?? null,
  questionBottomText: data.questionBottomText ?? null,
  questionImageUrls: normalizeQuestionMediaUrls(data.questionImageUrls),
  explanation: data.explanation,
  solutionTopText: data.solutionTopText ?? null,
  solutionBottomText: data.solutionBottomText ?? null,
  solutionImageUrls: normalizeQuestionMediaUrls(data.solutionImageUrls),
  answerText: data.answerText,
  answerFormula: data.mode === "variable" ? data.answerFormula : null,
  variablesSchema: data.mode === "variable" ? (data.variablesSchema ?? []) : null,
  parametricValueSets:
    data.mode === "variable" && data.parametricValueSets?.length
      ? data.parametricValueSets
      : null,
  variantContents:
    data.mode === "variable" && data.variantContents?.length
      ? data.variantContents
      : null,
  isPublished: data.isPublished ?? false,
  marks: data.marks ?? 1,
  ...(createdBy ? { createdBy } : {}),
  ...(reviewMetadata
    ? {
        reviewedBy: reviewMetadata.reviewedBy ?? null,
        reviewedAt: reviewMetadata.reviewedAt ?? null,
      }
    : {}),
});
