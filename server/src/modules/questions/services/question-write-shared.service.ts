import { eq } from "drizzle-orm";
import { db, questionOption } from "@/db";

type QuestionOptionInput = {
  label?: string | null;
  text: string;
  isCorrect: boolean;
};

export const insertQuestionOptions = async (
  questionId: string,
  options: QuestionOptionInput[],
) => {
  if (!options.length) return;

  for (const [index, option] of options.entries()) {
    await db.insert(questionOption).values({
      questionId,
      label: option.label ?? null,
      text: option.text,
      isCorrect: option.isCorrect,
      sortOrder: index,
    });
  }
};

export const replaceQuestionOptions = async (
  questionId: string,
  options: QuestionOptionInput[],
) => {
  await db.delete(questionOption).where(eq(questionOption.questionId, questionId));
  await insertQuestionOptions(questionId, options);
};
