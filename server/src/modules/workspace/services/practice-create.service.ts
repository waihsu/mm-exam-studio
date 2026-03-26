import { db, practiceSession, practiceSessionItem } from "@/db";
import { getUserWorkspaceAccess } from "../../subscriptions/subscription.core";
import {
  assertPracticeSessionQuota,
  assertQuestionSelectionWithinLimit,
  buildPreviewPayload,
  deriveCorrectAnswerText,
  previewQuestionForWorkspace,
  resolveSelectionQuestions,
} from "./workspace-shared.service";
import type { CreatePracticeSessionInput } from "../workspace.schema";

export const createPracticeSession = async (
  userId: string,
  input: CreatePracticeSessionInput,
) => {
  if (input.questionType === "long_answer") {
    throw new Error("Long answer questions are available for question papers, not practice sessions.");
  }

  const access = await getUserWorkspaceAccess(userId);
  await assertPracticeSessionQuota({
    userId,
    access,
  });

  const questions = await resolveSelectionQuestions({
    questionIds: input.questionIds,
    count: input.count,
    questionMix: input.questionMix,
    access,
    generatorMode: input.generatorMode,
    filters: {
      search: input.search,
      gradeId: input.gradeId,
      subjectId: input.subjectId,
      chapterId: input.chapterId,
      subChapterId: input.subChapterId,
      questionType: input.questionType,
      excludeQuestionTypes: ["long_answer"],
    },
  });

  assertQuestionSelectionWithinLimit({
    selectedCount: questions.length,
    limit: access.maxQuestionsPerPractice,
    label: "practice session",
  });

  const itemPayloads = await Promise.all(
    questions.map(async (question, index) => {
      const preview = await previewQuestionForWorkspace(buildPreviewPayload(question));
      const renderedOptions = preview.options.map((option) => ({
        label: option.label ?? null,
        text: option.text,
        isCorrect: option.isCorrect,
      }));

      return {
        position: index + 1,
        questionId: question.id,
        questionCode: question.questionCode,
        questionType: question.type,
        marks: question.marks,
        renderedBody: preview.body,
        renderedExplanation: preview.explanation ?? null,
        renderedAnswerText: deriveCorrectAnswerText(
          question.type,
          renderedOptions,
          preview.answerText,
        ),
        renderedOptions,
        variableContext: preview.context ?? null,
      };
    }),
  );

  const [sessionRow] = await db
    .insert(practiceSession)
    .values({
      userId,
      title: input.title?.trim() || "Practice Session",
      gradeId: input.gradeId || null,
      subjectId: input.subjectId || null,
      chapterId: input.chapterId || null,
      subChapterId: input.subChapterId || null,
      totalQuestions: itemPayloads.length,
    })
    .returning();
  const session = {
    id: sessionRow.id,
    totalQuestions: sessionRow.totalQuestions,
    title: sessionRow.title,
  };

  if (itemPayloads.length > 0) {
    for (const item of itemPayloads) {
      await db.insert(practiceSessionItem).values({
        sessionId: session.id,
        position: item.position,
        questionId: item.questionId,
        questionCode: item.questionCode,
        questionType: item.questionType,
        marks: item.marks,
        renderedBody: item.renderedBody,
        renderedExplanation: item.renderedExplanation ?? null,
        renderedAnswerText: item.renderedAnswerText ?? null,
        renderedOptions: item.renderedOptions,
        variableContext: item.variableContext,
      });
    }
  }

  return session;
};
