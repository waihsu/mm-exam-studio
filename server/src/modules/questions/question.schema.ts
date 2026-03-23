import { z } from "zod";

const ALLOWED_MARKS = [1, 2, 3, 5, 10] as const;
const QUESTION_TYPES = [
  "mcq",
  "true_false",
  "short_answer",
  "long_answer",
  "fill_blank",
  "matching",
] as const;
const QUESTION_MARKS_BY_TYPE = {
  mcq: [1],
  true_false: [1],
  fill_blank: [1],
  short_answer: [2, 3],
  matching: [5],
  long_answer: [10],
} as const satisfies Record<(typeof QUESTION_TYPES)[number], readonly number[]>;

const reservedVariableNames = new Set([
  "pi",
  "e",
  "sqrt",
  "abs",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "sind",
  "cosd",
  "tand",
  "secd",
  "cscd",
  "cotd",
  "asin",
  "acos",
  "atan",
  "asind",
  "acosd",
  "atand",
  "log",
  "ln",
  "exp",
  "sinh",
  "cosh",
  "tanh",
  "pow",
  "fact",
  "npr",
  "ncr",
  "gcd",
  "lcm",
  "if",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "rad",
  "deg",
]);

const questionOptionSchema = z.object({
  label: z.string().optional(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const questionVariableSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
        message:
          "Variable keys must start with a letter or underscore and contain only letters, numbers, and underscores.",
      }),
    label: z.string().trim().optional(),
    type: z.enum(["number", "text"]),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    choices: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "number") {
      if (typeof value.min !== "number" || typeof value.max !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["min"],
          message: "Number variables require both min and max.",
        });
      }

      if (
        typeof value.min === "number" &&
        typeof value.max === "number" &&
        value.min > value.max
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max"],
          message: "Variable max must be greater than or equal to min.",
        });
      }
    }

    if (value.type === "text" && (!value.choices || value.choices.length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["choices"],
        message: "Text variables need at least one choice.",
      });
    }

    if (reservedVariableNames.has(value.key.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["key"],
        message:
          "This variable key is reserved for formula functions or constants.",
      });
    }
  });

const questionSchemaBase = z.object({
  questionCode: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  mode: z.enum(["static", "variable"]).default("static"),
  reviewStatus: z
    .enum(["draft", "in_review", "needs_changes", "approved"])
    .optional(),
  reviewNotes: z.string().nullable().optional(),

  gradeId: z.string(),
  subjectId: z.string(),
  chapterId: z.string().nullable().optional(),
  subChapterId: z.string().nullable().optional(),

  explanation: z.string().nullable().optional(),
  answerText: z.string().nullable().optional(),
  answerFormula: z.string().nullable().optional(),
  variablesSchema: z.array(questionVariableSchema).optional(),
  isPublished: z.boolean().optional(),
  marks: z
    .number()
    .int()
    .refine((value) => ALLOWED_MARKS.includes(value as (typeof ALLOWED_MARKS)[number]), {
      message: "Marks must be one of: 1, 2, 3, 5, or 10.",
    })
    .optional(),
  options: z.array(questionOptionSchema).optional(),
});

const previewValuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
);

const applyQuestionRefinements = (
  value: {
    type?:
      | "mcq"
      | "true_false"
      | "short_answer"
      | "long_answer"
      | "fill_blank"
      | "matching";
    mode?: "static" | "variable";
    reviewStatus?: "draft" | "in_review" | "needs_changes" | "approved";
    reviewNotes?: string | null | undefined;
    options?:
      | Array<{
          label?: string | null | undefined;
          text: string;
          isCorrect: boolean;
        }>
      | undefined;
    answerText?: string | null | undefined;
    answerFormula?: string | null | undefined;
    marks?: number | undefined;
    variablesSchema?: Array<{ key: string }> | undefined;
  },
  ctx: z.RefinementCtx,
) => {
  if (!value.type) return;

  if (typeof value.marks === "number") {
    const allowedMarks = QUESTION_MARKS_BY_TYPE[value.type];
    if (!allowedMarks.some((mark) => mark === value.marks)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["marks"],
        message: `${value.type.replace("_", " ")} questions must use marks: ${allowedMarks.join(", ")}.`,
      });
    }
  }

  if (value.type === "mcq") {
    if (!value.options || value.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "MCQ questions need at least 2 options.",
      });
    }

    if (!value.options?.some((option) => option.isCorrect)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "At least one option must be marked correct.",
      });
    }
  }

  if (value.type === "matching") {
    const filledPairs =
      value.options?.filter((option) => option.label?.trim() && option.text.trim()) ?? [];
    if (filledPairs.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Matching questions need at least 2 labeled pairs.",
      });
    }
  }

  if (
    value.type !== "mcq" &&
    value.type !== "matching" &&
    value.type !== "long_answer" &&
    !value.answerText?.trim() &&
    !value.answerFormula?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["answerText"],
      message:
        "Answer text or an answer formula is required for non-MCQ questions.",
    });
  }

  if (value.mode === "variable") {
    if (!value.variablesSchema?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variablesSchema"],
        message: "Variable questions need at least one variable definition.",
      });
    }

    const keys = value.variablesSchema?.map((item) => item.key) ?? [];
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variablesSchema"],
        message: "Variable keys must be unique.",
      });
    }
  }

  if (
    value.mode === "static" &&
    ((value.variablesSchema && value.variablesSchema.length > 0) ||
      value.answerFormula?.trim())
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mode"],
      message:
        "Static questions cannot include variable definitions or answer formulas.",
    });
  }

  if (value.reviewStatus === "needs_changes" && !value.reviewNotes?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewNotes"],
      message: "Add review notes when marking a question as needs changes.",
    });
  }
};

export const createQuestionSchema = questionSchemaBase.superRefine(
  applyQuestionRefinements,
);

export const updateQuestionSchema = questionSchemaBase
  .partial()
  .superRefine(applyQuestionRefinements);

export const questionPreviewSchema = questionSchemaBase
  .extend({
    previewValues: previewValuesSchema.optional(),
  })
  .superRefine(applyQuestionRefinements);

export const questionImportSchema = z.object({
  items: z.array(createQuestionSchema).min(1).max(200),
});

export type QuestionVariableInput = z.infer<typeof questionVariableSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionPreviewInput = z.infer<typeof questionPreviewSchema>;
export type QuestionImportInput = z.infer<typeof questionImportSchema>;
