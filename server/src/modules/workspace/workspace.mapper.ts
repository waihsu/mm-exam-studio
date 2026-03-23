export type RenderedOption = {
  label?: string | null;
  text: string;
  isCorrect?: boolean;
};

export type PracticeSessionItemForClient = {
  id: string;
  position: number;
  questionCode: string;
  questionType: string;
  marks: number;
  renderedBody: string;
  renderedExplanation: string | null;
  renderedAnswerText: string | null;
  renderedOptions: unknown;
  variableContext: unknown;
  submittedAnswer: string | null;
  isCorrect: boolean | null;
};

export const toRenderedOptions = (value: unknown): RenderedOption[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const option = item as {
      label?: unknown;
      text?: unknown;
      isCorrect?: unknown;
    };

    if (typeof option.text !== "string") {
      return [];
    }

    return [
      {
        label: typeof option.label === "string" ? option.label : null,
        text: option.text,
        isCorrect: typeof option.isCorrect === "boolean" ? option.isCorrect : undefined,
      },
    ];
  });
};

export const mapPracticeItemForClient = (
  item: PracticeSessionItemForClient,
  revealAnswers: boolean,
) => {
  const options = toRenderedOptions(item.renderedOptions).map((option) => ({
    label: option.label,
    text: option.text,
    ...(revealAnswers && typeof option.isCorrect === "boolean"
      ? { isCorrect: option.isCorrect }
      : {}),
  }));

  return {
    id: item.id,
    position: item.position,
    questionCode: item.questionCode,
    questionType: item.questionType,
    marks: item.marks,
    body: item.renderedBody,
    explanation: revealAnswers ? item.renderedExplanation : null,
    answerText: revealAnswers ? item.renderedAnswerText : null,
    options,
    variableContext: item.variableContext,
    submittedAnswer: item.submittedAnswer,
    isCorrect: revealAnswers ? item.isCorrect : null,
  };
};
