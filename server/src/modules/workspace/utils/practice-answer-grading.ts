import {
  canonicalizeMatchingPairs,
  parseMatchingAnswer,
} from "./matching-answer";
import {
  isLiteralAnswerEquivalent,
  isShortAnswerEquivalent,
} from "./answer-grading";

export type PracticeAnswerQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "matching";

export type PracticeAnswerOption = {
  label?: string | null;
  text: string;
  isCorrect?: boolean;
};

const toPracticeAnswerOptions = (value: unknown): PracticeAnswerOption[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const option = item as {
      label?: unknown;
      text?: unknown;
      isCorrect?: unknown;
    };
    if (typeof option.text !== "string") return [];

    return [{
      label: typeof option.label === "string" ? option.label : null,
      text: option.text,
      isCorrect: typeof option.isCorrect === "boolean" ? option.isCorrect : undefined,
    }];
  });
};

export const isPracticeAnswerCorrect = (params: {
  questionType: PracticeAnswerQuestionType | string;
  options: PracticeAnswerOption[];
  answerText?: string | null;
  submittedAnswer?: string | null;
}) => {
  const submittedAnswer = params.submittedAnswer ?? "";

  if (params.questionType === "matching") {
    const expectedPairs = params.options.reduce<Record<string, string>>((pairs, option, index) => {
      const left = option.label?.trim() || `Item ${index + 1}`;
      const right = option.text.trim();
      if (!left || !right) return pairs;
      pairs[left] = right;
      return pairs;
    }, {});

    const expected = canonicalizeMatchingPairs(expectedPairs);
    const submitted = canonicalizeMatchingPairs(parseMatchingAnswer(submittedAnswer));
    return expected.length > 0 && expected === submitted;
  }

  const correctValues = [
    ...params.options
      .filter((option) => option.isCorrect)
      .map((option) => option.label?.trim() || option.text.trim()),
    ...(params.answerText ? [params.answerText] : []),
  ].filter(Boolean);

  return correctValues.some((value) =>
    params.questionType === "short_answer"
      ? isShortAnswerEquivalent(value, submittedAnswer)
      : isLiteralAnswerEquivalent(value, submittedAnswer),
  );
};

type PracticeSessionAnswerSnapshot = {
  id: string;
  questionType: string;
  renderedOptions: unknown;
  renderedAnswerText?: string | null;
};

/**
 * Grades the exact rendered snapshot stored in a practice session. Keeping this
 * pure makes the create -> submit contract testable without a live database.
 */
export const gradePracticeSessionAnswers = (params: {
  items: PracticeSessionAnswerSnapshot[];
  answers: Array<{ itemId: string; answer?: string | null }>;
}) => {
  const answerMap = new Map(
    params.answers.map((entry) => [entry.itemId, entry.answer?.trim() ?? ""]),
  );
  const items = params.items.map((item) => {
    const submittedAnswer = answerMap.get(item.id) ?? "";
    const isCorrect = isPracticeAnswerCorrect({
      questionType: item.questionType,
      options: toPracticeAnswerOptions(item.renderedOptions),
      answerText: item.renderedAnswerText,
      submittedAnswer,
    });

    return {
      id: item.id,
      submittedAnswer: submittedAnswer || null,
      isCorrect,
    };
  });

  const correctAnswers = items.filter((item) => item.isCorrect).length;
  return {
    items,
    correctAnswers,
    scorePercent:
      items.length > 0
        ? Number(((correctAnswers / items.length) * 100).toFixed(2))
        : 0,
  };
};
