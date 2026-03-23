import { db, question as questionTable } from "@/db";
import { toStoredQuestionData } from "../question.mapper";
import { questionRepo } from "../question.repo";
import type { CreateQuestionInput } from "../question.schema";
import { validateVariableConfiguration } from "../utils/math-engine";
import { invalidateQuestionReadCaches } from "./question-read.service";
import {
  assertPublishState,
  normalizeReviewStatus,
  validateQuestionRelations,
} from "./question-shared.service";
import { insertQuestionOptions } from "./question-write-shared.service";

export const createQuestion = async (
  data: CreateQuestionInput,
  createdBy?: string,
) => {
  const reviewStatus = normalizeReviewStatus({
    isPublished: data.isPublished ?? false,
    reviewStatus: data.reviewStatus,
    fallback: "draft",
  });

  assertPublishState({
    isPublished: data.isPublished,
    reviewStatus,
  });

  await validateQuestionRelations({
    gradeId: data.gradeId,
    subjectId: data.subjectId,
    chapterId: data.chapterId,
    subChapterId: data.subChapterId,
  });

  validateVariableConfiguration({
    mode: data.mode,
    body: data.body,
    explanation: data.explanation,
    answerText: data.answerText,
    answerFormula: data.answerFormula,
    options: data.options,
    variablesSchema: data.variablesSchema,
  });

  const [question] = await db
    .insert(questionTable)
    .values(
      toStoredQuestionData(
        {
          ...data,
          reviewStatus,
        },
        createdBy,
      ),
    )
    .returning();

  await insertQuestionOptions(question.id, data.options ?? []);

  invalidateQuestionReadCaches();
  return questionRepo.findById(question.id);
};
