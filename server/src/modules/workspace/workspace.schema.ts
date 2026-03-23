import { z } from "zod";

const generatorModeSchema = z.enum(["all_questions", "mcq_only"]);

const questionSelectionSchema = z
  .object({
    search: z.string().trim().optional(),
    gradeId: z.string().trim().optional(),
    subjectId: z.string().trim().optional(),
    chapterId: z.string().trim().optional(),
    subChapterId: z.string().trim().optional(),
    questionType: z
      .enum(["mcq", "true_false", "short_answer", "long_answer", "fill_blank", "matching"])
      .optional(),
    generatorMode: generatorModeSchema.optional(),
    questionIds: z.array(z.string().trim().min(1)).max(50).optional(),
    count: z.number().int().min(1).max(50).optional(),
  })
  .superRefine((value, ctx) => {
    if ((!value.questionIds || value.questionIds.length === 0) && !value.count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: "Provide either selected questionIds or a count to auto-pick questions.",
      });
    }
  });

export const createPracticeSessionSchema = questionSelectionSchema.extend({
  title: z.string().trim().max(120).optional(),
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
  brandAssetId: z.string().trim().min(1).optional(),
  includeAnswerKey: z.boolean().optional(),
});

export const updateQuestionPaperSchema = z.object({
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(1000).optional(),
  schoolName: z.string().trim().max(160).optional(),
  academicYear: z.string().trim().max(60).optional(),
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
export type UpdateQuestionPaperInput = z.infer<typeof updateQuestionPaperSchema>;
export type ReorderQuestionPaperItemsInput = z.infer<typeof reorderQuestionPaperItemsSchema>;
export type SwapQuestionPaperItemInput = z.infer<typeof swapQuestionPaperItemSchema>;
export type UpdateQuestionPaperStatusInput = z.infer<typeof updateQuestionPaperStatusSchema>;
