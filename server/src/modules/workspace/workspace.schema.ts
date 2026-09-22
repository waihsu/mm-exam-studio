import { z } from "zod";

const generatorModeSchema = z.enum(["all_questions", "mcq_only"]);
const questionTypeSchema = z.enum([
  "mcq",
  "true_false",
  "short_answer",
  "long_answer",
  "fill_blank",
  "matching",
]);

const questionMixEntrySchema = z.object({
  questionType: questionTypeSchema,
  count: z.number().int().min(1).max(50),
});

const questionSelectionSchema = z
  .object({
    search: z.string().trim().optional(),
    gradeId: z.string().trim().optional(),
    subjectId: z.string().trim().optional(),
    chapterId: z.string().trim().optional(),
    subChapterId: z.string().trim().optional(),
    questionType: questionTypeSchema.optional(),
    generatorMode: generatorModeSchema.optional(),
    questionIds: z.array(z.string().trim().min(1)).max(50).optional(),
    count: z.number().int().min(1).max(50).optional(),
    questionMix: z.array(questionMixEntrySchema).max(6).optional(),
  })
  .superRefine((value, ctx) => {
    const hasQuestionIds = (value.questionIds?.length ?? 0) > 0;
    const hasCount = typeof value.count === "number";
    const hasQuestionMix = (value.questionMix?.length ?? 0) > 0;

    if (!hasQuestionIds && !hasCount && !hasQuestionMix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message:
          "Provide selected questionIds, a count, or a questionMix to auto-pick questions.",
      });
    }

    if (hasQuestionMix && hasQuestionIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionMix"],
        message: "questionMix cannot be combined with explicit questionIds.",
      });
    }

    if (hasQuestionMix && hasCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionMix"],
        message: "questionMix already defines the counts for auto-pick questions.",
      });
    }

    if (hasQuestionMix && value.questionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionType"],
        message: "Single questionType filter cannot be combined with questionMix.",
      });
    }

    if (hasQuestionMix && value.generatorMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["generatorMode"],
        message: "generatorMode cannot be combined with questionMix.",
      });
    }

    if (hasQuestionMix) {
      const totalRequested = value.questionMix?.reduce((sum, entry) => sum + entry.count, 0) ?? 0;
      if (totalRequested > 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questionMix"],
          message: "questionMix can request at most 50 questions in total.",
        });
      }

      const seenTypes = new Set<string>();
      for (const [index, entry] of (value.questionMix ?? []).entries()) {
        if (seenTypes.has(entry.questionType)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questionMix", index, "questionType"],
            message: "Each question type can appear only once in questionMix.",
          });
        }
        seenTypes.add(entry.questionType);
      }
    }
  });

export const createPracticeSessionSchema = questionSelectionSchema
  .extend({
    title: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.gradeId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gradeId"],
        message: "Choose a grade before starting a practice session.",
      });
    }

    if (!value.subjectId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjectId"],
        message: "Choose a subject before starting a practice session.",
      });
    }

    if (value.questionType === "long_answer") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionType"],
        message: "Long answer questions are available for papers, not practice sessions.",
      });
    }

    for (const [index, entry] of (value.questionMix ?? []).entries()) {
      if (entry.questionType === "long_answer") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questionMix", index, "questionType"],
          message: "Long answer questions are available for papers, not practice sessions.",
        });
      }
    }
  });

export const submitPracticeSessionSchema = z.object({
  answers: z
    .array(
      z.object({
        itemId: z.string().trim().min(1),
        answer: z.string().trim().optional(),
      }),
    )
    .min(1),
});

export const createQuestionPaperSchema = questionSelectionSchema.extend({
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(1000).optional(),
  schoolName: z.string().trim().max(160).optional(),
  academicYear: z.string().trim().max(60).optional(),
  pdfTemplateKey: z.enum(["default", "myanmar_matric"]).default("default"),
  examYearLabel: z.string().trim().max(20).optional(),
  timeAllowedLabel: z.string().trim().max(60).optional(),
  departmentLine: z.string().trim().max(160).optional(),
  answerInstructionLine: z.string().trim().max(200).optional(),
  brandAssetId: z.string().trim().min(1).optional(),
  includeAnswerKey: z.boolean().optional(),
});

export const updateQuestionPaperSchema = z.object({
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(1000).optional(),
  schoolName: z.string().trim().max(160).optional(),
  academicYear: z.string().trim().max(60).optional(),
  pdfTemplateKey: z.enum(["default", "myanmar_matric"]).optional(),
  examYearLabel: z.string().trim().max(20).optional(),
  timeAllowedLabel: z.string().trim().max(60).optional(),
  departmentLine: z.string().trim().max(160).optional(),
  answerInstructionLine: z.string().trim().max(200).optional(),
  brandAssetId: z.string().trim().min(1).nullable().optional(),
  includeAnswerKey: z.boolean().optional(),
});

export const reorderQuestionPaperItemsSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(50),
});

export const swapQuestionPaperItemSchema = z.object({
  candidateQuestionId: z.string().trim().min(1).optional(),
});

export const updateQuestionPaperStatusSchema = z.object({
  status: z.enum(["draft", "finalized"]),
});

export type CreatePracticeSessionInput = z.infer<typeof createPracticeSessionSchema>;
export type SubmitPracticeSessionInput = z.infer<typeof submitPracticeSessionSchema>;
export type CreateQuestionPaperInput = z.infer<typeof createQuestionPaperSchema>;
export type QuestionMixEntry = z.infer<typeof questionMixEntrySchema>;
export type UpdateQuestionPaperInput = z.infer<typeof updateQuestionPaperSchema>;
export type ReorderQuestionPaperItemsInput = z.infer<typeof reorderQuestionPaperItemsSchema>;
export type SwapQuestionPaperItemInput = z.infer<typeof swapQuestionPaperItemSchema>;
export type UpdateQuestionPaperStatusInput = z.infer<typeof updateQuestionPaperStatusSchema>;
