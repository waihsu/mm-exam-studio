import type { CreateQuestionInput } from "../question.schema";
import { createQuestion } from "./question-write-create.service";

export const importQuestions = async (
  items: CreateQuestionInput[],
  createdBy?: string,
) => {
  const created: Array<{
    index: number;
    id: string;
    questionCode: string;
  }> = [];
  const failures: Array<{
    index: number;
    questionCode: string;
    message: string;
  }> = [];

  for (const [index, item] of items.entries()) {
    try {
      const question = await createQuestion(item, createdBy);
      if (!question) {
        throw new Error("Question import returned no record.");
      }

      created.push({
        index: index + 1,
        id: question.id,
        questionCode: question.questionCode,
      });
    } catch (error) {
      failures.push({
        index: index + 1,
        questionCode: item.questionCode,
        message:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Failed to import this row.",
      });
    }
  }

  return {
    summary: {
      total: items.length,
      succeeded: created.length,
      failed: failures.length,
    },
    created,
    failures,
  };
};
