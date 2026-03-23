import type { QuestionPreviewInput } from "../question.schema";
import {
  renderQuestionPreviewResult,
  validateVariableConfiguration,
} from "../utils/math-engine";

export const previewQuestion = async (data: QuestionPreviewInput) => {
  validateVariableConfiguration({
    mode: data.mode,
    body: data.body,
    explanation: data.explanation,
    answerText: data.answerText,
    answerFormula: data.answerFormula,
    options: data.options,
    variablesSchema: data.variablesSchema,
  });

  return renderQuestionPreviewResult(data);
};
