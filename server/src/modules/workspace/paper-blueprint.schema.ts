import { z } from "zod";

const blueprintQuestionTypeSchema = z.enum([
  "mcq",
  "true_false",
  "short_answer",
  "long_answer",
  "fill_blank",
  "matching",
]);

const blueprintModeSchema = z.enum(["mcq_only", "all_type", "custom"]);
const blueprintStatusSchema = z.enum(["draft", "ready", "archived"]);
const blueprintDifficultySchema = z.enum(["easy", "normal", "hard", "advance"]);
const blueprintPlanCodeSchema = z.enum(["free", "pro", "premium"]);
const paperPdfTemplateKeySchema = z.enum(["default", "myanmar_matric"]);

export const paperBlueprintPresetConfigSchema = z
  .object({
    chapterIds: z.array(z.string().trim().min(1)).max(50).optional(),
    subChapterIds: z.array(z.string().trim().min(1)).max(200).optional(),
  })
  .passthrough();

export const paperBlueprintDifficultyDistributionSchema = z
  .object({
    easy: z.number().int().min(0).max(100),
    normal: z.number().int().min(0).max(100),
    hard: z.number().int().min(0).max(100),
    advance: z.number().int().min(0).max(100),
  })
  .superRefine((value, ctx) => {
    const total = value.easy + value.normal + value.hard + value.advance;
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["easy"],
        message: "Difficulty distribution must total exactly 100%.",
      });
    }

    if (value.hard + value.advance > 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hard"],
        message: "Hard and advance together must not exceed 30%.",
      });
    }
  });

export const paperBlueprintTemplateConfigSchema = z
  .object({
    isPublished: z.boolean().default(false),
    availablePlanCodes: z.array(blueprintPlanCodeSchema).max(3).default([]),
  })
  .transform((value) => ({
    isPublished: value.isPublished,
    availablePlanCodes: [...new Set(value.availablePlanCodes)],
  }));

export const paperBlueprintSectionInputSchema = z.object({
  code: z.string().trim().min(1).max(24),
  title: z.string().trim().max(120).optional(),
  questionType: blueprintQuestionTypeSchema.optional(),
  marksPerQuestion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(10)]).optional(),
  questionCount: z.number().int().min(1).max(200),
  totalMarks: z.number().int().min(1).max(1000),
  sortOrder: z.number().int().min(0).max(200),
});

export const paperBlueprintSlotInputSchema = z.object({
  sectionCode: z.string().trim().min(1).max(24).optional(),
  slotNumber: z.number().int().min(1).max(500),
  questionType: blueprintQuestionTypeSchema,
  marks: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(10)]),
  difficultyTarget: blueprintDifficultySchema.optional(),
  chapterId: z.string().trim().min(1).optional(),
  subChapterId: z.string().trim().min(1).optional(),
  lockedQuestionId: z.string().trim().min(1).optional(),
  swapLimit: z.number().int().min(1).max(10).default(3),
  slotConfig: z.record(z.string(), z.unknown()).optional(),
});

const paperBlueprintBaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  mode: blueprintModeSchema,
  status: blueprintStatusSchema.default("draft"),
  gradeId: z.string().trim().min(1),
  subjectId: z.string().trim().min(1),
  totalMarks: z.number().int().min(1).max(1000),
  pdfTemplateKey: paperPdfTemplateKeySchema.default("default"),
  examYearLabel: z.string().trim().max(20).optional(),
  timeAllowedLabel: z.string().trim().max(60).optional(),
  departmentLine: z.string().trim().max(160).optional(),
  answerInstructionLine: z.string().trim().max(200).optional(),
  includeAnswerPaper: z.boolean().optional(),
  difficultyDistribution: paperBlueprintDifficultyDistributionSchema,
  presetConfig: paperBlueprintPresetConfigSchema.optional(),
  templateConfig: paperBlueprintTemplateConfigSchema.optional(),
  sections: z.array(paperBlueprintSectionInputSchema).max(20).default([]),
  slots: z.array(paperBlueprintSlotInputSchema).max(500).default([]),
});

export const createPaperBlueprintSchema = paperBlueprintBaseSchema.superRefine(
  (value, ctx) => {
    const uniqueSectionCodes = new Set<string>();
    for (const [sectionIndex, section] of value.sections.entries()) {
      if (uniqueSectionCodes.has(section.code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", sectionIndex, "code"],
          message: "Section codes must be unique within a blueprint.",
        });
      }
      uniqueSectionCodes.add(section.code);
    }

    const uniqueSlotNumbers = new Set<number>();
    for (const [slotIndex, slot] of value.slots.entries()) {
      if (uniqueSlotNumbers.has(slot.slotNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", slotIndex, "slotNumber"],
          message: "Slot numbers must be unique within a blueprint.",
        });
      }
      uniqueSlotNumbers.add(slot.slotNumber);

      if (slot.subChapterId && !slot.chapterId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", slotIndex, "chapterId"],
          message: "A chapter is required before assigning a sub chapter to a slot.",
        });
      }

      if (slot.sectionCode && !uniqueSectionCodes.has(slot.sectionCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", slotIndex, "sectionCode"],
          message: "Each slot sectionCode must match a defined section.",
        });
      }
    }

    if (value.mode === "custom" && value.slots.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slots"],
        message: "Custom blueprints need at least one slot.",
      });
    }

    const templateConfig = value.templateConfig;
    if (templateConfig?.isPublished) {
      if (value.status !== "ready") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["status"],
          message: "Published templates must use ready status.",
        });
      }

      if (templateConfig.availablePlanCodes.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["templateConfig", "availablePlanCodes"],
          message: "Choose at least one plan before publishing a template.",
        });
      }
    }
  },
);

export const updatePaperBlueprintSchema = paperBlueprintBaseSchema.partial();

export const materializePaperBlueprintSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  instructions: z.string().trim().max(1000).optional(),
  schoolName: z.string().trim().max(160).optional(),
  academicYear: z.string().trim().max(60).optional(),
  pdfTemplateKey: paperPdfTemplateKeySchema.optional(),
  examYearLabel: z.string().trim().max(20).optional(),
  timeAllowedLabel: z.string().trim().max(60).optional(),
  departmentLine: z.string().trim().max(160).optional(),
  answerInstructionLine: z.string().trim().max(200).optional(),
  brandAssetId: z.string().trim().min(1).optional(),
});

export type PaperBlueprintMode = z.infer<typeof blueprintModeSchema>;
export type PaperBlueprintStatus = z.infer<typeof blueprintStatusSchema>;
export type PaperBlueprintDifficulty = z.infer<typeof blueprintDifficultySchema>;
export type PaperBlueprintDifficultyDistribution = z.infer<
  typeof paperBlueprintDifficultyDistributionSchema
>;
export type PaperBlueprintPresetConfig = z.infer<typeof paperBlueprintPresetConfigSchema>;
export type PaperBlueprintPlanCode = z.infer<typeof blueprintPlanCodeSchema>;
export type PaperPdfTemplateKey = z.infer<typeof paperPdfTemplateKeySchema>;
export type PaperBlueprintTemplateConfig = z.infer<typeof paperBlueprintTemplateConfigSchema>;
export type PaperBlueprintSectionInput = z.infer<
  typeof paperBlueprintSectionInputSchema
>;
export type PaperBlueprintSlotInput = z.infer<typeof paperBlueprintSlotInputSchema>;
export type CreatePaperBlueprintInput = z.infer<typeof createPaperBlueprintSchema>;
export type UpdatePaperBlueprintInput = z.infer<typeof updatePaperBlueprintSchema>;
export type MaterializePaperBlueprintInput = z.infer<typeof materializePaperBlueprintSchema>;
