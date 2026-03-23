import { z } from "zod";

const trimmedString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const createGradeSchema = z.object({
  code: trimmedString("Grade code"),
  name: trimmedString("Grade name"),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateGradeSchema = createGradeSchema.partial();

export const createSubjectSchema = z.object({
  code: trimmedString("Subject code"),
  name: trimmedString("Subject name"),
  description: optionalTrimmedString,
  isActive: z.boolean().default(true),
  gradeIds: z.array(z.string()).default([]),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createChapterSchema = z.object({
  gradeId: trimmedString("Grade"),
  subjectId: trimmedString("Subject"),
  code: optionalTrimmedString,
  name: trimmedString("Chapter name"),
  description: optionalTrimmedString,
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateChapterSchema = createChapterSchema.partial();

export const createSubChapterSchema = z.object({
  chapterId: trimmedString("Chapter"),
  code: optionalTrimmedString,
  name: trimmedString("Sub chapter name"),
  description: optionalTrimmedString,
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateSubChapterSchema = createSubChapterSchema.partial();

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type CreateSubChapterInput = z.infer<typeof createSubChapterSchema>;
export type UpdateSubChapterInput = z.infer<typeof updateSubChapterSchema>;
