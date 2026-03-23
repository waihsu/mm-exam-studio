import type { CreateQuestionInput } from "./question.schema";

export const toStoredQuestionData = (
  data: Pick<
    CreateQuestionInput,
    | "questionCode"
    | "body"
    | "type"
    | "difficulty"
    | "mode"
    | "reviewStatus"
    | "reviewNotes"
    | "gradeId"
    | "subjectId"
    | "chapterId"
    | "subChapterId"
    | "explanation"
    | "answerText"
    | "answerFormula"
    | "variablesSchema"
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
  reviewStatus:
    data.isPublished ? (data.reviewStatus ?? "approved") : (data.reviewStatus ?? "draft"),
  reviewNotes: data.reviewNotes,
  gradeId: data.gradeId,
  subjectId: data.subjectId,
  chapterId: data.chapterId,
  subChapterId: data.subChapterId,
  explanation: data.explanation,
  answerText: data.answerText,
  answerFormula: data.mode === "variable" ? data.answerFormula : null,
  variablesSchema: data.mode === "variable" ? (data.variablesSchema ?? []) : null,
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
