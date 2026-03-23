import type {
  QuestionInput,
  QuestionPreviewRequestInput,
  QuestionSubmitInput,
} from "../schema/question.schema";
import type {
  QuestionRecord,
  QuestionType,
  QuestionVariableDefinition,
} from "../types/question.type";

export type VariableDraft = {
  variablesSchema: QuestionInput["variablesSchema"];
  answerFormula: string;
  previewValues: Record<string, string>;
};

export const createEmptyOptions = () => [
  { label: "A", text: "", isCorrect: false },
  { label: "B", text: "", isCorrect: false },
  { label: "C", text: "", isCorrect: false },
  { label: "D", text: "", isCorrect: false },
];

export const createEmptyMatchingOptions = () => [
  { label: "Item 1", text: "", isCorrect: true },
  { label: "Item 2", text: "", isCorrect: true },
];

export const createEmptyVariable = (): QuestionVariableDefinition => ({
  key: "",
  label: "",
  type: "number",
  min: 1,
  max: 10,
  step: 1,
  choices: [],
});

export const ensureMcqOptions = (options: QuestionInput["options"]) => {
  const nextOptions = options.length ? [...options] : [];

  while (nextOptions.length < 4) {
    nextOptions.push({
      label: String.fromCharCode(65 + nextOptions.length),
      text: "",
      isCorrect: false,
    });
  }

  return nextOptions;
};

export const ensureMatchingOptions = (options: QuestionInput["options"]) => {
  const nextOptions = options.length
    ? options.map((option, index) => ({
        ...option,
        label: option.label ?? `Item ${index + 1}`,
        isCorrect: true,
      }))
    : [];

  while (nextOptions.length < 2) {
    nextOptions.push({
      label: `Item ${nextOptions.length + 1}`,
      text: "",
      isCorrect: true,
    });
  }

  return nextOptions;
};

const sanitizeQuestionOptions = (
  type: QuestionType,
  options: QuestionInput["options"],
) => {
  if (type !== "mcq" && type !== "matching") {
    return [];
  }

  const cleaned = options
    .map((option, index) => ({
      ...option,
      text: option.text.trim(),
      label:
        type === "matching"
          ? option.label?.trim() || `Item ${index + 1}`
          : option.label?.trim() || undefined,
      isCorrect: type === "matching" ? true : option.isCorrect,
    }))
    .filter((option) => option.text);

  if (type === "mcq") {
    return cleaned;
  }

  return cleaned.filter((option) => option.label?.trim());
};

export const normalizeVariableDefinitions = (
  variables: QuestionVariableDefinition[] | null | undefined,
) =>
  (variables ?? []).map((variable) => ({
    key: variable.key ?? "",
    label: variable.label ?? "",
    type: variable.type,
    min: variable.min ?? undefined,
    max: variable.max ?? undefined,
    step: variable.step ?? undefined,
    choices: variable.choices ?? [],
  }));

export const createInitialFormState = (
  initialValue?: QuestionRecord | null,
): QuestionInput => {
  if (!initialValue) {
    return {
      questionCode: `QB-${Date.now()}`,
      body: "",
      type: "mcq",
      difficulty: "medium",
      mode: "static",
      gradeId: "",
      subjectId: "",
      chapterId: "",
      subChapterId: "",
      explanation: "",
      answerText: "",
      answerFormula: "",
      variablesSchema: [],
      isPublished: false,
      marks: 1,
      options: createEmptyOptions(),
    };
  }

  return {
    questionCode: initialValue.questionCode,
    body: initialValue.body,
    type: initialValue.type,
    difficulty: initialValue.difficulty,
    mode: initialValue.mode ?? "static",
    gradeId: initialValue.grade.id,
    subjectId: initialValue.subject.id,
    chapterId: initialValue.chapter?.id ?? "",
    subChapterId: initialValue.subChapter?.id ?? "",
    explanation: initialValue.explanation ?? "",
    answerText: initialValue.answerText ?? "",
    answerFormula: initialValue.answerFormula ?? "",
    variablesSchema: normalizeVariableDefinitions(initialValue.variablesSchema),
    isPublished: initialValue.isPublished,
    marks: initialValue.marks,
    options:
      initialValue.type === "mcq"
        ? ensureMcqOptions(
            initialValue.options.map((option) => ({
              label: option.label ?? undefined,
              text: option.text,
              isCorrect: option.isCorrect,
            })),
          )
        : initialValue.type === "matching"
          ? ensureMatchingOptions(
              initialValue.options.map((option) => ({
                label: option.label ?? undefined,
                text: option.text,
                isCorrect: true,
              })),
            )
          : createEmptyOptions(),
  };
};

export const createVariableDraft = (
  initialValue?: QuestionRecord | null,
): VariableDraft => ({
  variablesSchema: normalizeVariableDefinitions(initialValue?.variablesSchema),
  answerFormula: initialValue?.answerFormula ?? "",
  previewValues: {},
});

export const getPreviewValueDefault = (variable: QuestionVariableDefinition) => {
  if (variable.type === "number") {
    return variable.min !== undefined ? String(variable.min) : "";
  }

  return variable.choices?.[0] ?? "";
};

export const sanitizeVariables = (variables: QuestionInput["variablesSchema"]) =>
  variables
    .map((variable) => ({
      key: variable.key.trim(),
      label: variable.label?.trim() || undefined,
      type: variable.type,
      min: variable.type === "number" ? variable.min : undefined,
      max: variable.type === "number" ? variable.max : undefined,
      step: variable.type === "number" ? variable.step : undefined,
      choices:
        variable.type === "text"
          ? (variable.choices ?? [])
              .map((choice) => choice.trim())
              .filter(Boolean)
          : undefined,
    }))
    .filter((variable) => variable.key.length > 0);

export const createQuestionValidationPayload = (
  form: QuestionInput,
): QuestionInput => ({
  ...form,
  chapterId: form.chapterId || undefined,
  subChapterId: form.subChapterId || undefined,
  explanation: form.explanation?.trim() || undefined,
  answerText: form.answerText?.trim() || undefined,
  answerFormula:
    form.mode === "variable" ? form.answerFormula?.trim() || undefined : undefined,
  variablesSchema:
    form.mode === "variable" ? sanitizeVariables(form.variablesSchema) : [],
  options: sanitizeQuestionOptions(form.type, form.options),
});

export const createQuestionSubmitPayload = (
  form: QuestionInput,
): QuestionSubmitInput => ({
  ...form,
  chapterId: form.chapterId || null,
  subChapterId: form.subChapterId || null,
  explanation: form.explanation?.trim() || null,
  answerText: form.answerText?.trim() || null,
  answerFormula:
    form.mode === "variable" ? form.answerFormula?.trim() || null : null,
  variablesSchema:
    form.mode === "variable" ? sanitizeVariables(form.variablesSchema) : [],
  options: sanitizeQuestionOptions(form.type, form.options),
});

export const createQuestionPreviewPayload = (
  form: QuestionInput,
  previewValues: Record<string, string>,
): QuestionPreviewRequestInput => {
  const payload = createQuestionSubmitPayload(form);
  const normalizedPreviewValues = payload.variablesSchema.reduce<
    Record<string, string>
  >((nextPreviewValues, variable) => {
    const rawValue = previewValues[variable.key];
    if (typeof rawValue !== "string") {
      return nextPreviewValues;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue.length) {
      return nextPreviewValues;
    }

    nextPreviewValues[variable.key] = trimmedValue;
    return nextPreviewValues;
  }, {});

  if (!Object.keys(normalizedPreviewValues).length) {
    return payload;
  }

  return {
    ...payload,
    previewValues: normalizedPreviewValues,
  };
};

export const appendTemplateToken = (
  currentValue: string | undefined,
  key: string,
) => {
  const token = `{{${key}}}`;
  const value = currentValue ?? "";

  if (!value.trim().length) {
    return token;
  }

  return `${value}${/\s$/.test(value) ? "" : " "}${token}`;
};
