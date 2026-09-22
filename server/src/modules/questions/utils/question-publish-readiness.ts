import type { CreateQuestionInput } from "../question.schema";
import { renderQuestionPreviewResult } from "./math-engine";

type PublishableQuestion = Pick<
  CreateQuestionInput,
  | "body"
  | "type"
  | "mode"
  | "answerText"
  | "answerFormula"
  | "options"
  | "variablesSchema"
  | "parametricValueSets"
  | "variantContents"
>;

const normalizePublishValue = (value: string | null | undefined) =>
  String(value ?? "").trim().toLocaleLowerCase();

const getRenderedPublishSamples = (question: PublishableQuestion) => {
  if (question.mode !== "variable") {
    return [{ answerText: question.answerText ?? null, options: question.options ?? [] }];
  }

  const previewValues = (question.variablesSchema ?? []).reduce<Record<string, string | number>>(
    (values, variable) => {
      values[variable.key] =
        variable.type === "number" ? (variable.min ?? 1) : (variable.choices?.[0] ?? "");
      return values;
    },
    {},
  );
  const setIndexes = question.parametricValueSets?.length
    ? question.parametricValueSets.map((_, index) => index)
    : [undefined];

  return setIndexes.map((parametricSetIndex) => {
    const preview = renderQuestionPreviewResult({
      ...question,
      previewValues,
      parametricSetIndex,
    });
    return { answerText: preview.answerText, options: preview.options };
  });
};

/**
 * Learner-safety checks for a fully resolved question. Call this after a partial
 * update is merged with stored data, so toggling publish cannot bypass checks.
 */
export const getQuestionPublishReadinessIssues = (question: PublishableQuestion) => {
  const issues: string[] = [];

  if (!question.body.trim()) {
    issues.push("A published question needs question text.");
  }

  let samples: ReturnType<typeof getRenderedPublishSamples>;
  try {
    samples = getRenderedPublishSamples(question);
  } catch (error) {
    issues.push(
      error instanceof Error && error.message.trim()
        ? `Question preview failed: ${error.message}`
        : "Question preview failed. Check variables and answer formula.",
    );
    return issues;
  }

  for (const sample of samples) {
    const options = sample.options.filter((option) => option.text.trim());

    if (question.type === "mcq") {
      if (options.length < 2) issues.push("A published MCQ needs at least two non-empty options.");
      if (options.filter((option) => option.isCorrect).length !== 1) {
        issues.push("A published MCQ needs exactly one correct option.");
      }
      const learnerValues = options.map((option) => option.label?.trim() || option.text.trim());
      if (new Set(learnerValues).size !== learnerValues.length) {
        issues.push("MCQ options must have unique labels or answer values.");
      }
    }

    if (question.type === "matching") {
      if (options.length < 2) {
        issues.push("A published matching question needs at least two complete pairs.");
      }
      const labels = options.map((option) => option.label?.trim() ?? "");
      if (labels.some((label) => !label)) {
        issues.push("Every matching pair needs a left-side label.");
      } else if (new Set(labels).size !== labels.length) {
        issues.push("Matching pair labels must be unique.");
      }
    }

    if (question.type === "true_false") {
      const value = normalizePublishValue(sample.answerText);
      if (value !== "true" && value !== "false") {
        issues.push('A published true/false question must use an answer key of "True" or "False".');
      }
    }

    if ((question.type === "short_answer" || question.type === "fill_blank") && !String(sample.answerText ?? "").trim()) {
      issues.push("A published practice question needs a rendered answer key.");
    }
  }

  return [...new Set(issues)];
};

export const assertQuestionPublishReady = (question: PublishableQuestion) => {
  const issues = getQuestionPublishReadinessIssues(question);
  if (issues.length > 0) {
    throw new Error(`This question cannot be published: ${issues.join(" ")}`);
  }
};
