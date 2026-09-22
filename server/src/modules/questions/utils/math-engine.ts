import type {
  CreateQuestionInput,
  QuestionParametricValueSetInput,
  QuestionVariantContentInput,
  QuestionVariableInput,
} from "../question.schema";

type VariableContextValue = string | number;
type VariableContext = Record<string, VariableContextValue>;
type VariablePreviewValues = Record<string, string | number>;
type MathFunctionDefinition = {
  minArgs: number;
  maxArgs?: number;
  evaluate: (args: number[]) => number;
};

const PLACEHOLDER_PATTERN = /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;
const IDENTIFIER_PATTERN = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

const MATH_CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
} as const;

const validateLogValue = (value: number, label: string) => {
  if (value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
};

const validatePrecision = (value: number) => {
  if (!Number.isInteger(value)) {
    throw new Error("Precision argument must be an integer.");
  }
};

const validateInteger = (value: number, label: string) => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }
};

const validateNonNegativeInteger = (value: number, label: string) => {
  validateInteger(value, label);
  if (value < 0) {
    throw new Error(`${label} must be greater than or equal to 0.`);
  }
};

const factorial = (value: number) => {
  validateNonNegativeInteger(value, "fact() input");
  let result = 1;
  for (let index = 2; index <= value; index += 1) {
    result *= index;
  }
  return result;
};

const greatestCommonDivisor = (left: number, right: number) => {
  validateInteger(left, "gcd() first input");
  validateInteger(right, "gcd() second input");
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
};

const scaleByPrecision = (
  value: number,
  precision: number,
  strategy: "round" | "floor" | "ceil",
) => {
  validatePrecision(precision);
  const factor = 10 ** precision;
  const scaled = value * factor;
  const result =
    strategy === "round"
      ? Math.round(scaled)
      : strategy === "floor"
        ? Math.floor(scaled)
        : Math.ceil(scaled);
  return result / factor;
};

const MATH_FUNCTIONS: Record<string, MathFunctionDefinition> = {
  sqrt: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      if (value < 0) {
        throw new Error("sqrt() input must be greater than or equal to 0.");
      }
      return Math.sqrt(value);
    },
  },
  abs: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.abs(value),
  },
  sin: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.sin(value),
  },
  cos: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.cos(value),
  },
  tan: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.tan(value),
  },
  sec: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const cosine = Math.cos(value);
      if (cosine === 0) {
        throw new Error("sec() is undefined for this input.");
      }
      return 1 / cosine;
    },
  },
  csc: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const sine = Math.sin(value);
      if (sine === 0) {
        throw new Error("csc() is undefined for this input.");
      }
      return 1 / sine;
    },
  },
  cot: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const tangent = Math.tan(value);
      if (tangent === 0) {
        throw new Error("cot() is undefined for this input.");
      }
      return 1 / tangent;
    },
  },
  sind: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.sin(toRadians(value)),
  },
  cosd: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.cos(toRadians(value)),
  },
  tand: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.tan(toRadians(value)),
  },
  secd: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const cosine = Math.cos(toRadians(value));
      if (cosine === 0) {
        throw new Error("secd() is undefined for this input.");
      }
      return 1 / cosine;
    },
  },
  cscd: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const sine = Math.sin(toRadians(value));
      if (sine === 0) {
        throw new Error("cscd() is undefined for this input.");
      }
      return 1 / sine;
    },
  },
  cotd: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      const tangent = Math.tan(toRadians(value));
      if (tangent === 0) {
        throw new Error("cotd() is undefined for this input.");
      }
      return 1 / tangent;
    },
  },
  asin: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.asin(value),
  },
  acos: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.acos(value),
  },
  atan: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.atan(value),
  },
  asind: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => toDegrees(Math.asin(value)),
  },
  acosd: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => toDegrees(Math.acos(value)),
  },
  atand: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => toDegrees(Math.atan(value)),
  },
  log: {
    minArgs: 1,
    maxArgs: 2,
    evaluate: ([value, base]) => {
      validateLogValue(value, "log() input");
      if (base === undefined) {
        return Math.log10(value);
      }
      validateLogValue(base, "log() base");
      if (base === 1) {
        throw new Error("log() base cannot be 1.");
      }
      return Math.log(value) / Math.log(base);
    },
  },
  ln: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => {
      validateLogValue(value, "ln() input");
      return Math.log(value);
    },
  },
  exp: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.exp(value),
  },
  sinh: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.sinh(value),
  },
  cosh: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.cosh(value),
  },
  tanh: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => Math.tanh(value),
  },
  pow: {
    minArgs: 2,
    maxArgs: 2,
    evaluate: ([value, exponent]) => Math.pow(value, exponent),
  },
  fact: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => factorial(value),
  },
  npr: {
    minArgs: 2,
    maxArgs: 2,
    evaluate: ([n, r]) => {
      validateNonNegativeInteger(n, "npr() n");
      validateNonNegativeInteger(r, "npr() r");
      if (r > n) {
        throw new Error("npr() requires r to be less than or equal to n.");
      }
      return factorial(n) / factorial(n - r);
    },
  },
  ncr: {
    minArgs: 2,
    maxArgs: 2,
    evaluate: ([n, r]) => {
      validateNonNegativeInteger(n, "ncr() n");
      validateNonNegativeInteger(r, "ncr() r");
      if (r > n) {
        throw new Error("ncr() requires r to be less than or equal to n.");
      }
      return factorial(n) / (factorial(r) * factorial(n - r));
    },
  },
  gcd: {
    minArgs: 2,
    maxArgs: 2,
    evaluate: ([left, right]) => greatestCommonDivisor(left, right),
  },
  lcm: {
    minArgs: 2,
    maxArgs: 2,
    evaluate: ([left, right]) => {
      const gcd = greatestCommonDivisor(left, right);
      if (gcd === 0) {
        return 0;
      }
      return Math.abs(left * right) / gcd;
    },
  },
  if: {
    minArgs: 3,
    maxArgs: 3,
    evaluate: ([condition, truthyValue, falsyValue]) =>
      condition !== 0 ? truthyValue : falsyValue,
  },
  min: {
    minArgs: 1,
    evaluate: (args) => Math.min(...args),
  },
  max: {
    minArgs: 1,
    evaluate: (args) => Math.max(...args),
  },
  round: {
    minArgs: 1,
    maxArgs: 2,
    evaluate: ([value, precision]) =>
      precision === undefined
        ? Math.round(value)
        : scaleByPrecision(value, precision, "round"),
  },
  floor: {
    minArgs: 1,
    maxArgs: 2,
    evaluate: ([value, precision]) =>
      precision === undefined
        ? Math.floor(value)
        : scaleByPrecision(value, precision, "floor"),
  },
  ceil: {
    minArgs: 1,
    maxArgs: 2,
    evaluate: ([value, precision]) =>
      precision === undefined
        ? Math.ceil(value)
        : scaleByPrecision(value, precision, "ceil"),
  },
  rad: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => toRadians(value),
  },
  deg: {
    minArgs: 1,
    maxArgs: 1,
    evaluate: ([value]) => toDegrees(value),
  },
};

const RESERVED_FORMULA_IDENTIFIERS = new Set([
  ...Object.keys(MATH_CONSTANTS),
  ...Object.keys(MATH_FUNCTIONS),
]);

const extractTemplateKeys = (template?: string | null) => {
  if (!template) return [];
  return [...template.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]);
};

const extractFormulaKeys = (expression?: string | null) => {
  if (!expression?.trim()) return [];
  return [...expression.matchAll(IDENTIFIER_PATTERN)]
    .map((match) => match[0])
    .filter((key) => !RESERVED_FORMULA_IDENTIFIERS.has(key.toLowerCase()));
};

const assertReferencedVariablesExist = (
  keys: string[],
  variableMap: Map<string, QuestionVariableInput>,
  fieldLabel: string,
) => {
  for (const key of keys) {
    if (!variableMap.has(key)) {
      throw new Error(
        `${fieldLabel} references "{{${key}}}" but that variable is not defined.`,
      );
    }
  }
};

const tokenizeExpression = (expression: string) => {
  const tokens: Array<
    | { type: "number"; value: number }
    | { type: "identifier"; value: string }
    | {
        type: "operator";
        value:
          | "+"
          | "-"
          | "*"
          | "/"
          | "%"
          | "^"
          | "("
          | ")"
          | ","
          | "<"
          | "<="
          | ">"
          | ">="
          | "=="
          | "!=";
      }
  > = [];

  let index = 0;
  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const multiCharOperator = expression.slice(index).match(/^(<=|>=|==|!=)/);
    if (multiCharOperator) {
      tokens.push({
        type: "operator",
        value: multiCharOperator[0] as
          | "<="
          | ">="
          | "=="
          | "!=",
      });
      index += multiCharOperator[0].length;
      continue;
    }

    if (/[+\-*/%^(),<>]/.test(char)) {
      tokens.push({
        type: "operator",
        value: char as
          | "+"
          | "-"
          | "*"
          | "/"
          | "%"
          | "^"
          | "("
          | ")"
          | ","
          | "<"
          | ">",
      });
      index += 1;
      continue;
    }

    const numberMatch = expression.slice(index).match(/^(\d+(\.\d+)?|\.\d+)/);
    if (numberMatch) {
      tokens.push({
        type: "number",
        value: Number(numberMatch[0]),
      });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = expression
      .slice(index)
      .match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifierMatch) {
      tokens.push({
        type: "identifier",
        value: identifierMatch[0],
      });
      index += identifierMatch[0].length;
      continue;
    }

    throw new Error(`Unsupported token "${char}" in answer formula.`);
  }

  return tokens;
};

const evaluateNumericExpression = (
  expression: string,
  context: VariableContext,
) => {
  const tokens = tokenizeExpression(expression);
  let position = 0;

  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  const expectOperator = (
    value:
      | "+"
      | "-"
      | "*"
      | "/"
      | "%"
      | "^"
      | "("
      | ")"
      | ","
      | "<"
      | "<="
      | ">"
      | ">="
      | "=="
      | "!=",
  ) => {
    const token = consume();
    if (!token || token.type !== "operator" || token.value !== value) {
      throw new Error(`Expected "${value}" in answer formula.`);
    }
  };

  const toNumericVariable = (key: string) => {
    const value = context[key];
    if (typeof value !== "number") {
      throw new Error(
        `Answer formula can only use numeric variables. "${key}" is not numeric.`,
      );
    }
    return value;
  };

  const assertFiniteResult = (label: string, value: number) => {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} produced a non-finite result.`);
    }
    return value;
  };

  const evaluateFunctionCall = (name: string, args: number[]) => {
    const normalizedName = name.toLowerCase();
    const definition = MATH_FUNCTIONS[normalizedName];

    if (!definition) {
      throw new Error(`Unsupported function "${name}" in answer formula.`);
    }

    if (args.length < definition.minArgs) {
      throw new Error(
        `${name}() requires at least ${definition.minArgs} argument(s).`,
      );
    }

    if (definition.maxArgs !== undefined && args.length > definition.maxArgs) {
      throw new Error(
        `${name}() allows at most ${definition.maxArgs} argument(s).`,
      );
    }

    return assertFiniteResult(`${name}()`, definition.evaluate(args));
  };

  const parsePrimary = (): number => {
    const token = consume();
    if (!token) {
      throw new Error("Unexpected end of answer formula.");
    }

    if (token.type === "number") {
      return token.value;
    }

    if (token.type === "identifier") {
      const nextToken = peek();

      if (
        nextToken?.type === "operator" &&
        nextToken.value === "("
      ) {
        consume();
        const args: number[] = [];

        if (!(peek()?.type === "operator" && peek()?.value === ")")) {
          while (true) {
            args.push(parseComparison());
            if (peek()?.type === "operator" && peek()?.value === ",") {
              consume();
              continue;
            }
            break;
          }
        }

        expectOperator(")");
        return evaluateFunctionCall(token.value, args);
      }

      const constantValue =
        MATH_CONSTANTS[token.value.toLowerCase() as keyof typeof MATH_CONSTANTS];
      if (constantValue !== undefined) {
        return constantValue;
      }

      return toNumericVariable(token.value);
    }

    if (token.value === "(") {
      const value = parseComparison();
      expectOperator(")");
      return value;
    }

    throw new Error("Invalid answer formula.");
  };

  const parsePower = (): number => {
    let value = parsePrimary();

    if (peek()?.type === "operator" && peek()?.value === "^") {
      consume();
      value = Math.pow(value, parseUnary());
    }

    return assertFiniteResult("Power operation", value);
  };

  const parseUnary = (): number => {
    const token = peek();

    if (token?.type === "operator" && token.value === "+") {
      consume();
      return parseUnary();
    }

    if (token?.type === "operator" && token.value === "-") {
      consume();
      return -parseUnary();
    }

    return parsePower();
  };

  const parseTerm = (): number => {
    let value = parseUnary();

    while (
      peek()?.type === "operator" &&
      (peek()!.value === "*" || peek()!.value === "/" || peek()!.value === "%")
    ) {
      const operator = consume().value;
      const nextValue = parseUnary();

      if ((operator === "/" || operator === "%") && nextValue === 0) {
        throw new Error("Division or modulo by zero is not allowed.");
      }

      value =
        operator === "*"
          ? value * nextValue
          : operator === "/"
            ? value / nextValue
            : value % nextValue;
    }

    return assertFiniteResult("Arithmetic operation", value);
  };

  const parseExpression = (): number => {
    let value = parseTerm();

    while (
      peek()?.type === "operator" &&
      (peek()!.value === "+" || peek()!.value === "-")
    ) {
      const operator = consume().value;
      const nextValue = parseTerm();
      value = operator === "+" ? value + nextValue : value - nextValue;
    }

    return assertFiniteResult("Expression", value);
  };

  const parseComparison = (): number => {
    let value = parseExpression();

    while (
      peek()?.type === "operator" &&
      (peek()!.value === "<" ||
        peek()!.value === "<=" ||
        peek()!.value === ">" ||
        peek()!.value === ">=" ||
        peek()!.value === "==" ||
        peek()!.value === "!=")
    ) {
      const operator = consume().value;
      const nextValue = parseExpression();

      const comparisonResult =
        operator === "<"
          ? value < nextValue
          : operator === "<="
            ? value <= nextValue
            : operator === ">"
              ? value > nextValue
              : operator === ">="
                ? value >= nextValue
                : operator === "=="
                  ? value === nextValue
                  : value !== nextValue;
      value = comparisonResult ? 1 : 0;
    }

    return value;
  };

  const result = parseComparison();
  if (position < tokens.length) {
    throw new Error("Could not fully evaluate answer formula.");
  }

  return result;
};

const coerceVariableOverride = (
  variable: QuestionVariableInput,
  value: string | number,
): VariableContextValue => {
  if (variable.type === "number") {
    const numericValue =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Preview value for "${variable.key}" must be numeric.`);
    }
    return numericValue;
  }

  const textValue = String(value);
  const choices = variable.choices ?? [];

  if (choices.length > 0 && !choices.includes(textValue)) {
    throw new Error(
      `Preview value for "${variable.key}" must be one of: ${choices.join(", ")}.`,
    );
  }

  return textValue;
};

const generateVariableValue = (variable: QuestionVariableInput) => {
  if (variable.type === "text") {
    return variable.choices?.[0] ?? variable.label ?? variable.key;
  }

  const min = variable.min ?? 1;
  const max = variable.max ?? min;
  const step = variable.step ?? 1;

  if (step <= 0) {
    throw new Error(`Variable "${variable.key}" needs a positive step.`);
  }

  const totalSteps = Math.floor((max - min) / step);
  const selectedStep = Math.floor(Math.random() * (totalSteps + 1));
  return min + selectedStep * step;
};

const buildVariableContext = (
  variables: QuestionVariableInput[] | undefined,
  previewValues?: VariablePreviewValues,
  parametricValueSets?: QuestionParametricValueSetInput[],
  parametricSetIndex?: number,
) => {
  if (!variables?.length) {
    return {
      context: {} as VariableContext,
      selectedParametricSetIndex: null as number | null,
    };
  }

  let selectedParametricSetIndex: number | null = null;
  let selectedParametricValueSet: QuestionParametricValueSetInput | undefined;

  if (parametricValueSets?.length) {
    if (
      typeof parametricSetIndex === "number" &&
      (parametricSetIndex < 0 || parametricSetIndex >= parametricValueSets.length)
    ) {
      throw new Error("Selected parametric value set index is out of range.");
    }

    selectedParametricSetIndex =
      typeof parametricSetIndex === "number"
        ? parametricSetIndex
        : Math.floor(Math.random() * parametricValueSets.length);
    selectedParametricValueSet = parametricValueSets[selectedParametricSetIndex];
  }

  const context = variables.reduce<VariableContext>((nextContext, variable) => {
    const override =
      previewValues?.[variable.key] ?? selectedParametricValueSet?.[variable.key];
    nextContext[variable.key] =
      override !== undefined
        ? coerceVariableOverride(variable, override)
        : generateVariableValue(variable);
    return nextContext;
  }, {});

  return { context, selectedParametricSetIndex };
};

const renderTemplate = (
  template: string | null | undefined,
  context: VariableContext,
) => {
  if (!template) {
    return template ?? null;
  }

  return template.replace(
    PLACEHOLDER_PATTERN,
    (_, key: string) => String(context[key] ?? `{{${key}}}`),
  );
};

export const validateVariableConfiguration = (input: {
  mode: "static" | "variable";
  body: string;
  explanation?: string | null;
  answerText?: string | null;
  answerFormula?: string | null;
  options?: Array<{ label?: string; text: string; isCorrect: boolean }>;
  variablesSchema?: QuestionVariableInput[];
  parametricValueSets?: QuestionParametricValueSetInput[];
  variantContents?: QuestionVariantContentInput[];
}) => {
  if (input.mode !== "variable") {
    return;
  }

  const variableDefinitions = input.variablesSchema ?? [];
  for (const variable of variableDefinitions) {
    if (RESERVED_FORMULA_IDENTIFIERS.has(variable.key.toLowerCase())) {
      throw new Error(
        `Variable key "${variable.key}" is reserved for formula functions or constants.`,
      );
    }
  }

  const variableMap = new Map(
    variableDefinitions.map((variable) => [variable.key, variable]),
  );

  assertReferencedVariablesExist(
    extractTemplateKeys(input.body),
    variableMap,
    "Question body",
  );
  assertReferencedVariablesExist(
    extractTemplateKeys(input.explanation),
    variableMap,
    "Explanation",
  );
  assertReferencedVariablesExist(
    extractTemplateKeys(input.answerText),
    variableMap,
    "Answer text",
  );

  for (const [index, option] of (input.options ?? []).entries()) {
    assertReferencedVariablesExist(
      extractTemplateKeys(option.label),
      variableMap,
      `Option ${index + 1} label`,
    );
    assertReferencedVariablesExist(
      extractTemplateKeys(option.text),
      variableMap,
      `Option ${index + 1} text`,
    );
  }

  const formulaKeys = extractFormulaKeys(input.answerFormula);
  assertReferencedVariablesExist(formulaKeys, variableMap, "Answer formula");
  for (const key of formulaKeys) {
    const variable = variableMap.get(key);
    if (variable?.type !== "number") {
      throw new Error(
        `Answer formula can only use numeric variables. "${key}" is not numeric.`,
      );
    }
  }

  for (const [setIndex, valueSet] of (input.parametricValueSets ?? []).entries()) {
    for (const [key, value] of Object.entries(valueSet)) {
      const variable = variableMap.get(key);
      if (!variable) {
        throw new Error(
          `Parametric value set ${setIndex + 1} references unknown variable "${key}".`,
        );
      }

      coerceVariableOverride(variable, value);
    }
  }

  for (const [variantIndex, variant] of (input.variantContents ?? []).entries()) {
    validateVariableConfiguration({
      ...input,
      body: variant.body ?? input.body,
      explanation: variant.explanation ?? input.explanation,
      answerText: variant.answerText ?? input.answerText,
      answerFormula: variant.answerFormula ?? input.answerFormula,
      options: variant.options ?? input.options,
      variantContents: undefined,
    });

    if (variant.options?.length && !variant.options.some((option) => option.isCorrect)) {
      throw new Error(`Variant ${variantIndex + 1} needs at least one correct option.`);
    }
  }
};

export const renderQuestionPreviewResult = (
  data: Pick<
    CreateQuestionInput,
    | "body"
    | "explanation"
    | "answerText"
    | "answerFormula"
    | "options"
    | "mode"
    | "variablesSchema"
    | "parametricValueSets"
    | "variantContents"
  > & {
    previewValues?: VariablePreviewValues;
    parametricSetIndex?: number;
  },
) => {
  const variables = data.variablesSchema;
  const { context, selectedParametricSetIndex } = buildVariableContext(
    variables,
    data.previewValues,
    data.parametricValueSets,
    data.parametricSetIndex,
  );
  const selectedVariant =
    selectedParametricSetIndex === null
      ? undefined
      : data.variantContents?.[selectedParametricSetIndex];

  const body = selectedVariant?.body ?? data.body;
  const explanation = selectedVariant?.explanation ?? data.explanation;
  const answerText = selectedVariant?.answerText ?? data.answerText;
  const answerFormula = selectedVariant?.answerFormula ?? data.answerFormula;
  const options = selectedVariant?.options ?? data.options;

  const renderedAnswer =
    data.mode === "variable" && answerFormula?.trim()
      ? String(evaluateNumericExpression(answerFormula, context))
      : renderTemplate(answerText, context);

  return {
    context,
    selectedParametricSetIndex,
    body: renderTemplate(body, context) ?? "",
    explanation: renderTemplate(explanation, context),
    answerText: renderedAnswer,
    options:
      options?.map((option) => ({
        ...option,
        label: renderTemplate(option.label, context),
        text: renderTemplate(option.text, context) ?? "",
      })) ?? [],
  };
};
