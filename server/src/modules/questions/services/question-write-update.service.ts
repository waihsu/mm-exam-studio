import { eq } from "drizzle-orm";
import { db, question as questionTable } from "@/db";
import { toStoredQuestionData } from "../question.mapper";
import { questionRepo } from "../question.repo";
import type { CreateQuestionInput, UpdateQuestionInput } from "../question.schema";
import { validateVariableConfiguration } from "../utils/math-engine";
import { invalidateQuestionReadCaches } from "./question-read.service";
import {
  assertSwapGroupVariationIntegrity,
  assertPublishState,
  normalizeReviewStatus,
  toParametricValueSets,
  toQuestionOptionsInput,
  toQuestionImageUrls,
  toVariableDefinitions,
  validateStructuredQuestionData,
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
    swapGroupId:
      data.swapGroupId !== undefined ? data.swapGroupId : existingQuestion.swapGroupId,
    variationNumber:
      data.variationNumber !== undefined
        ? data.variationNumber
        : existingQuestion.variationNumber,
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
    questionTopText:
      data.questionTopText !== undefined
        ? data.questionTopText
        : existingQuestion.questionTopText,
    questionBottomText:
      data.questionBottomText !== undefined
        ? data.questionBottomText
        : existingQuestion.questionBottomText,
    questionImageUrls:
      data.questionImageUrls !== undefined
        ? data.questionImageUrls
        : toQuestionImageUrls(existingQuestion.questionImageUrls),
    explanation:
      data.explanation !== undefined ? data.explanation : existingQuestion.explanation,
    solutionTopText:
      data.solutionTopText !== undefined
        ? data.solutionTopText
        : existingQuestion.solutionTopText,
    solutionBottomText:
      data.solutionBottomText !== undefined
        ? data.solutionBottomText
        : existingQuestion.solutionBottomText,
    solutionImageUrls:
      data.solutionImageUrls !== undefined
        ? data.solutionImageUrls
        : toQuestionImageUrls(existingQuestion.solutionImageUrls),
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
    parametricValueSets:
      data.parametricValueSets !== undefined
        ? data.parametricValueSets
        : toParametricValueSets(existingQuestion.parametricValueSets),
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
  validateStructuredQuestionData(nextQuestion);
  await assertSwapGroupVariationIntegrity({
    questionId: id,
    swapGroupId: nextQuestion.swapGroupId,
    variationNumber: nextQuestion.variationNumber,
    gradeId: nextQuestion.gradeId,
    subjectId: nextQuestion.subjectId,
    type: nextQuestion.type,
    marks: nextQuestion.marks ?? 1,
  });

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
