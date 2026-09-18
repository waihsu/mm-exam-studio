import type { BlueprintMaterializeDraft } from "../components/blueprint-preview-content";
import type {
  MaterializeBlueprintInput,
  PaperBlueprintDetail,
  PaperBlueprintSectionInput,
  PaperBlueprintSlotInput,
  PaperBlueprintSubmitInput,
} from "../types";
import type { BlueprintFormDraft } from "./blueprint-builder.model";

const formatSectionsJson = (detail: PaperBlueprintDetail) =>
  JSON.stringify(
    detail.sections.map((section) => ({
      code: section.code,
      title: section.title ?? undefined,
      questionType: section.questionType ?? undefined,
      marksPerQuestion: section.marksPerQuestion ?? undefined,
      questionCount: section.questionCount,
      totalMarks: section.totalMarks,
      sortOrder: section.sortOrder,
    })),
    null,
    2,
  );

const formatSlotsJson = (detail: PaperBlueprintDetail) =>
  JSON.stringify(
    detail.slots.map((slot) => ({
      sectionCode: slot.sectionCode ?? undefined,
      slotNumber: slot.slotNumber,
      questionType: slot.questionType,
      marks: slot.marks,
      difficultyTarget: slot.difficultyTarget ?? undefined,
      chapterId: slot.chapterId ?? undefined,
      subChapterId: slot.subChapterId ?? undefined,
      lockedQuestionId: slot.lockedQuestion?.id ?? undefined,
      swapLimit: slot.swapLimit,
      slotConfig: slot.slotConfig ?? undefined,
    })),
    null,
    2,
  );

export const blueprintDetailToDraft = (
  detail: PaperBlueprintDetail,
): BlueprintFormDraft => ({
  title: detail.title,
  mode: detail.mode,
  status: detail.status,
  gradeId: detail.grade.id,
  subjectId: detail.subject.id,
  totalMarks: String(detail.totalMarks),
  pdfTemplateKey: detail.pdfTemplateKey,
  examYearLabel: detail.examYearLabel ?? "",
  timeAllowedLabel: detail.timeAllowedLabel ?? "",
  departmentLine: detail.departmentLine ?? "",
  answerInstructionLine: detail.answerInstructionLine ?? "",
  includeAnswerPaper: detail.includeAnswerPaper,
  publishToUsers: detail.templateConfig.isPublished,
  availablePlanCodes: detail.templateConfig.availablePlanCodes,
  difficultyDistribution: {
    easy: String(detail.difficultyDistribution.easy),
    normal: String(detail.difficultyDistribution.normal),
    hard: String(detail.difficultyDistribution.hard),
    advance: String(detail.difficultyDistribution.advance),
  },
  presetChapterIds: detail.presetConfig.chapterIds ?? [],
  presetSubChapterIds: detail.presetConfig.subChapterIds ?? [],
  sectionsJson: formatSectionsJson(detail),
  slotsJson: formatSlotsJson(detail),
});

export const parseBlueprintJsonArray = <T,>(label: string, value: string): T[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON array.`);
    }
    return parsed as T[];
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : `Invalid ${label.toLowerCase()} JSON.`,
    );
  }
};

const toDraftNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return Math.trunc(parsed);
};

export const buildBlueprintSubmitInput = (
  draft: BlueprintFormDraft,
): PaperBlueprintSubmitInput => ({
  title: draft.title.trim(),
  mode: draft.mode,
  status: draft.status,
  gradeId: draft.gradeId,
  subjectId: draft.subjectId,
  totalMarks: toDraftNumber(draft.totalMarks, "Total marks"),
  pdfTemplateKey: draft.pdfTemplateKey,
  examYearLabel: draft.examYearLabel.trim() || undefined,
  timeAllowedLabel: draft.timeAllowedLabel.trim() || undefined,
  departmentLine: draft.departmentLine.trim() || undefined,
  answerInstructionLine: draft.answerInstructionLine.trim() || undefined,
  includeAnswerPaper: draft.includeAnswerPaper,
  templateConfig: {
    isPublished: draft.publishToUsers,
    availablePlanCodes: draft.availablePlanCodes,
  },
  difficultyDistribution: {
    easy: toDraftNumber(draft.difficultyDistribution.easy, "Easy %"),
    normal: toDraftNumber(draft.difficultyDistribution.normal, "Normal %"),
    hard: toDraftNumber(draft.difficultyDistribution.hard, "Hard %"),
    advance: toDraftNumber(draft.difficultyDistribution.advance, "Advance %"),
  },
  presetConfig: {
    chapterIds: draft.presetChapterIds,
    subChapterIds: draft.presetSubChapterIds,
  },
  sections: parseBlueprintJsonArray("Sections", draft.sectionsJson),
  slots: parseBlueprintJsonArray("Slots", draft.slotsJson),
});

export const validateBlueprintDraftBeforeSubmit = (
  draft: BlueprintFormDraft,
): PaperBlueprintSubmitInput => {
  if (!draft.title.trim()) throw new Error("Blueprint title is required.");
  if (!draft.gradeId) throw new Error("Please select a grade.");
  if (!draft.subjectId) throw new Error("Please select a subject.");

  const easy = toDraftNumber(draft.difficultyDistribution.easy, "Easy %");
  const normal = toDraftNumber(draft.difficultyDistribution.normal, "Normal %");
  const hard = toDraftNumber(draft.difficultyDistribution.hard, "Hard %");
  const advance = toDraftNumber(draft.difficultyDistribution.advance, "Advance %");

  if (easy + normal + hard + advance !== 100) {
    throw new Error("Difficulty distribution must total exactly 100%.");
  }
  if (hard + advance > 30) {
    throw new Error("Hard + advance must not exceed 30%.");
  }
  if (draft.publishToUsers && draft.availablePlanCodes.length < 1) {
    throw new Error("Choose at least one plan before publishing this template.");
  }

  const sections = parseBlueprintJsonArray<PaperBlueprintSectionInput>(
    "Sections",
    draft.sectionsJson,
  );
  const slots = parseBlueprintJsonArray<PaperBlueprintSlotInput>("Slots", draft.slotsJson);

  for (const [index, section] of sections.entries()) {
    if (!section.code?.trim()) throw new Error(`Section ${index + 1} code is required.`);
  }
  for (const [index, slot] of slots.entries()) {
    if (!slot.questionType) throw new Error(`Slot ${index + 1} question type is required.`);
  }
  if (draft.mode === "custom" && slots.length < 1) {
    throw new Error("Custom blueprint needs at least one slot.");
  }

  return buildBlueprintSubmitInput(draft);
};

export const buildMaterializeBlueprintInput = (
  draft: BlueprintMaterializeDraft,
): MaterializeBlueprintInput => ({
  title: draft.title.trim() || undefined,
  schoolName: draft.schoolName.trim() || undefined,
  academicYear: draft.academicYear.trim() || undefined,
  instructions: draft.instructions.trim() || undefined,
});
