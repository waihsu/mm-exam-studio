import type { QuestionPreviewRequestInput } from "../../schema/question.schema";
import type { QuestionRecord } from "../../types/question.type";

export const VARIABLE_PREVIEW_SAMPLE_COUNT = 3;

export function buildQuestionReviewPreviewInputs(
  question: QuestionRecord,
): QuestionPreviewRequestInput[] {
  const fixedSetCount = question.parametricValueSets?.length ?? 0;
  const count =
    question.mode === "variable" ? fixedSetCount || VARIABLE_PREVIEW_SAMPLE_COUNT : 1;

  return Array.from({ length: count }, (_, index) => ({
    questionCode: question.questionCode,
    body: question.body,
    type: question.type,
    difficulty: question.difficulty,
    mode: question.mode,
    gradeId: question.grade.id,
    subjectId: question.subject.id,
    chapterId: question.chapter?.id ?? null,
    subChapterId: question.subChapter?.id ?? null,
    questionImageUrls: question.questionImageUrls ?? [],
    solutionImageUrls: question.solutionImageUrls ?? [],
    explanation: question.explanation ?? null,
    answerText: question.answerText ?? null,
    answerFormula: question.answerFormula ?? null,
    variablesSchema: question.variablesSchema ?? [],
    parametricValueSets: question.parametricValueSets ?? [],
    variantContents: question.variantContents ?? [],
    ...(fixedSetCount > 0 ? { parametricSetIndex: index } : {}),
    isPublished: question.isPublished,
    marks: question.marks,
    options: question.options.map((option) => ({
      label: option.label ?? undefined,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  }));
}
