import { eq } from "drizzle-orm";
import { db, question as questionTable } from "@/db";
import { toStoredQuestionData } from "../question.mapper";
import { questionRepo } from "../question.repo";
import type { CreateQuestionInput, UpdateQuestionInput } from "../question.schema";
import { validateVariableConfiguration } from "../utils/math-engine";
import { invalidateQuestionReadCaches } from "./question-read.service";
import {
  assertPublishState,
  normalizeReviewStatus,
  toQuestionOptionsInput,
  toVariableDefinitions,
  validateQuestionRelations,
} from "./question-shared.service";
import { replaceQuestionOptions } from "./question-write-shared.service";

export const updateQuestion = async (
  id: string,
  data: UpdateQuestionInput,
  reviewedBy?: string,
) => {
  const existingQuestion = await questionRepo.findById(id);
  if (!existingQuestion) {
    throw new Error("Question not found");
  }

  const nextChapterId =
    data.chapterId !== undefined
      ? data.chapterId
      : existingQuestion.chapterId;
  const nextSubChapterId =
    data.subChapterId !== undefined
      ? data.subChapterId
      : nextChapterId
        ? existingQuestion.subChapterId
        : null;
  const nextMode = data.mode ?? existingQuestion.mode;
  const nextIsPublished = data.isPublished ?? existingQuestion.isPublished;

  const nextQuestion = {
    questionCode: data.questionCode ?? existingQuestion.questionCode,
    body: data.body ?? existingQuestion.body,
    type: data.type ?? existingQuestion.type,
    difficulty: data.difficulty ?? existingQuestion.difficulty,
    mode: nextMode,
    reviewStatus: normalizeReviewStatus({
      isPublished: nextIsPublished,
      reviewStatus: data.reviewStatus,
      fallback: existingQuestion.reviewStatus,
    }),
    reviewNotes:
      data.reviewNotes !== undefined ? data.reviewNotes : existingQuestion.reviewNotes,
    gradeId: data.gradeId ?? existingQuestion.gradeId,
    subjectId: data.subjectId ?? existingQuestion.subjectId,
    chapterId: nextChapterId,
    subChapterId: nextSubChapterId,
    explanation:
      data.explanation !== undefined ? data.explanation : existingQuestion.explanation,
    answerText:
      data.answerText !== undefined ? data.answerText : existingQuestion.answerText,
    answerFormula:
      data.answerFormula !== undefined
        ? data.answerFormula
        : existingQuestion.answerFormula,
    variablesSchema:
      data.variablesSchema !== undefined
        ? data.variablesSchema
        : toVariableDefinitions(existingQuestion.variablesSchema),
    isPublished: nextIsPublished,
    marks: data.marks ?? existingQuestion.marks,
    options:
      data.options !== undefined
        ? data.options
        : toQuestionOptionsInput({ options: existingQuestion.options }),
  } satisfies CreateQuestionInput;

  assertPublishState({
    isPublished: nextQuestion.isPublished,
    reviewStatus: nextQuestion.reviewStatus,
  });

  await validateQuestionRelations({
    gradeId: nextQuestion.gradeId,
    subjectId: nextQuestion.subjectId,
    chapterId: nextQuestion.chapterId,
    subChapterId: nextQuestion.subChapterId,
  });

  validateVariableConfiguration(nextQuestion);

  if (data.options !== undefined) {
    await replaceQuestionOptions(id, data.options);
  }

  const {
    options, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...questionData
  } = nextQuestion;

  const shouldStampReview =
    data.reviewStatus !== undefined ||
    data.reviewNotes !== undefined ||
    existingQuestion.reviewStatus !== nextQuestion.reviewStatus;

  await db
    .update(questionTable)
    .set(
      toStoredQuestionData(
        questionData,
        undefined,
        shouldStampReview
          ? {
              reviewedBy: reviewedBy ?? null,
              reviewedAt: new Date(),
            }
          : undefined,
      ),
    )
    .where(eq(questionTable.id, id));

  invalidateQuestionReadCaches();
  return questionRepo.findById(id);
};
