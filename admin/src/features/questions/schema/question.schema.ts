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

const questionMediaArraySchema = z
  .array(z.string().trim().min(1, "Image URL cannot be empty."))
  .max(4, "You can add up to 4 image URLs.")
  .superRefine((value, ctx) => {
    const normalized = value.map((item) => item.trim());
    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate image URLs are not allowed.",
      });
    }
  });

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

const questionVariableSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, "Variable key is required")
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
        message:
          "Use letters, numbers, and underscores only. Variable keys must start with a letter or underscore.",
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
          message: "Number variables need both min and max values.",
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

export const questionSchema = z
  .object({
    questionCode: z.string().min(3, "Question code is required"),
    body: z.string().min(5, "Question too short"),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.enum(["easy", "medium", "hard"]),
    mode: z.enum(["static", "variable"]),
    reviewStatus: z
      .enum(["draft", "in_review", "needs_changes", "approved"])
      .optional(),
    reviewNotes: z.string().optional(),
    gradeId: z.string().min(1, "Select a grade"),
    subjectId: z.string().min(1, "Select a subject"),
    chapterId: z.string().optional(),
    subChapterId: z.string().optional(),
    questionImageUrls: questionMediaArraySchema.default([]),
    solutionImageUrls: questionMediaArraySchema.default([]),
    explanation: z.string().optional(),
    answerText: z.string().optional(),
    answerFormula: z.string().optional(),
    variablesSchema: z.array(questionVariableSchema).default([]),
    isPublished: z.boolean(),
    marks: z
      .number()
      .int()
      .refine((value) => ALLOWED_MARKS.includes(value as (typeof ALLOWED_MARKS)[number]), {
        message: "Marks must be one of: 1, 2, 3, 5, or 10.",
      }),
    options: z.array(
      z.object({
        label: z.string().optional(),
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean(),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    const allowedMarks = QUESTION_MARKS_BY_TYPE[value.type];
    if (!allowedMarks.some((mark) => mark === value.marks)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["marks"],
        message: `${value.type.replace("_", " ")} questions must use marks: ${allowedMarks.join(", ")}.`,
      });
    }

    if (value.type === "mcq") {
      const filledOptions = value.options.filter((option) => option.text.trim());
      if (filledOptions.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Add at least two options for MCQ questions.",
        });
      }

      if (!filledOptions.some((option) => option.isCorrect)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Mark at least one correct option.",
        });
      }
    }

    if (value.type === "matching") {
      const filledPairs = value.options.filter(
        (option) => option.label?.trim() && option.text.trim(),
      );
      if (filledPairs.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Add at least two matching pairs.",
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
        message: "Answer text or an answer formula is required.",
      });
    }

    if (value.mode === "variable" && value.variablesSchema.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variablesSchema"],
        message: "Add at least one variable for variable question mode.",
      });
    }

    if (
      value.mode === "static" &&
      (value.variablesSchema.length > 0 || value.answerFormula?.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mode"],
        message: "Static mode cannot include variables or answer formulas.",
      });
    }

    if (value.reviewStatus === "needs_changes" && !value.reviewNotes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reviewNotes"],
        message: "Add review notes when marking a question as needs changes.",
      });
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionSubmitInput = Omit<
  QuestionInput,
  | "chapterId"
  | "subChapterId"
  | "explanation"
  | "answerText"
  | "answerFormula"
  | "reviewNotes"
> & {
  chapterId?: string | null;
  subChapterId?: string | null;
  explanation?: string | null;
  answerText?: string | null;
  answerFormula?: string | null;
  reviewNotes?: string | null;
};

export type QuestionPreviewRequestInput = QuestionSubmitInput & {
  previewValues?: Record<string, string | number>;
};
