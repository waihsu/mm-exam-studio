import type { CreatePaperBlueprintInput } from "../paper-blueprint.schema";
import type { BlueprintRecord } from "./paper-blueprint.repository";
import {
  normalizePdfTemplateKey,
  normalizePresetConfig,
  normalizeTemplateConfig,
  summarizeGeneratedPaper,
} from "./paper-blueprint.utils";

export const mapBlueprintToResponse = (blueprint: NonNullable<BlueprintRecord>) => ({
  id: blueprint.id,
  title: blueprint.title,
  mode: blueprint.mode,
  status: blueprint.status,
  totalMarks: blueprint.totalMarks,
  pdfTemplateKey: blueprint.pdfTemplateKey,
  examYearLabel: blueprint.examYearLabel,
  timeAllowedLabel: blueprint.timeAllowedLabel,
  departmentLine: blueprint.departmentLine,
  answerInstructionLine: blueprint.answerInstructionLine,
  includeAnswerPaper: blueprint.includeAnswerPaper,
  difficultyDistribution: blueprint.difficultyDistribution as {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  },
  presetConfig: normalizePresetConfig(blueprint.presetConfig),
  templateConfig: normalizeTemplateConfig(blueprint.templateConfig),
  createdAt: blueprint.createdAt,
  updatedAt: blueprint.updatedAt,
  generatedPaperCount: blueprint.generatedPapers.length,
  latestGeneratedPaper:
    blueprint.generatedPapers.length > 0
      ? summarizeGeneratedPaper(blueprint.generatedPapers[0])
      : null,
  owner: blueprint.user
    ? { id: blueprint.user.id, name: blueprint.user.name, email: blueprint.user.email }
    : null,
  grade: blueprint.grade,
  subject: blueprint.subject,
  generatedPapers: blueprint.generatedPapers.map(summarizeGeneratedPaper),
  sections: blueprint.sections.map((section) => ({
    id: section.id,
    code: section.code,
    title: section.title,
    questionType: section.questionType,
    marksPerQuestion: section.marksPerQuestion,
    questionCount: section.questionCount,
    totalMarks: section.totalMarks,
    sortOrder: section.sortOrder,
  })),
  slots: blueprint.slots.map((slot) => ({
    id: slot.id,
    sectionId: slot.sectionId,
    sectionCode: slot.section?.code ?? null,
    slotNumber: slot.slotNumber,
    questionType: slot.questionType,
    marks: slot.marks,
    difficultyTarget: slot.difficultyTarget,
    chapterId: slot.chapterId,
    subChapterId: slot.subChapterId,
    swapLimit: slot.swapLimit,
    slotConfig: (slot.slotConfig as Record<string, unknown> | null) ?? null,
    chapter: slot.chapter
      ? { id: slot.chapter.id, code: slot.chapter.code, name: slot.chapter.name }
      : null,
    subChapter: slot.subChapter
      ? { id: slot.subChapter.id, code: slot.subChapter.code, name: slot.subChapter.name }
      : null,
    lockedQuestion: slot.lockedQuestion
      ? {
          id: slot.lockedQuestion.id,
          questionCode: slot.lockedQuestion.questionCode,
          type: slot.lockedQuestion.type,
          marks: slot.lockedQuestion.marks,
          title: slot.lockedQuestion.title,
        }
      : null,
    generatedQuestion: slot.generatedQuestion
      ? {
          id: slot.generatedQuestion.id,
          questionCode: slot.generatedQuestion.questionCode,
          type: slot.generatedQuestion.type,
          marks: slot.generatedQuestion.marks,
          title: slot.generatedQuestion.title,
        }
      : null,
  })),
});

export const mapBlueprintToInputShape = (
  blueprint: NonNullable<BlueprintRecord>,
): CreatePaperBlueprintInput => ({
  title: blueprint.title,
  mode: blueprint.mode,
  status: blueprint.status,
  gradeId: blueprint.gradeId,
  subjectId: blueprint.subjectId,
  totalMarks: blueprint.totalMarks,
  pdfTemplateKey: normalizePdfTemplateKey(blueprint.pdfTemplateKey),
  examYearLabel: blueprint.examYearLabel ?? undefined,
  timeAllowedLabel: blueprint.timeAllowedLabel ?? undefined,
  departmentLine: blueprint.departmentLine ?? undefined,
  answerInstructionLine: blueprint.answerInstructionLine ?? undefined,
  includeAnswerPaper: blueprint.includeAnswerPaper,
  difficultyDistribution: blueprint.difficultyDistribution as {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  },
  presetConfig: normalizePresetConfig(blueprint.presetConfig),
  templateConfig: normalizeTemplateConfig(blueprint.templateConfig),
  sections: blueprint.sections.map((section) => ({
    code: section.code,
    title: section.title ?? undefined,
    questionType: section.questionType ?? undefined,
    marksPerQuestion: (section.marksPerQuestion as 1 | 2 | 3 | 5 | 10 | null) ?? undefined,
    questionCount: section.questionCount,
    totalMarks: section.totalMarks,
    sortOrder: section.sortOrder,
  })),
  slots: blueprint.slots.map((slot) => ({
    sectionCode: slot.section?.code ?? undefined,
    slotNumber: slot.slotNumber,
    questionType: slot.questionType,
    marks: slot.marks as 1 | 2 | 3 | 5 | 10,
    difficultyTarget: slot.difficultyTarget ?? undefined,
    chapterId: slot.chapterId ?? undefined,
    subChapterId: slot.subChapterId ?? undefined,
    lockedQuestionId: slot.lockedQuestionId ?? undefined,
    swapLimit: slot.swapLimit,
    slotConfig: (slot.slotConfig as Record<string, unknown> | null) ?? undefined,
  })),
});
