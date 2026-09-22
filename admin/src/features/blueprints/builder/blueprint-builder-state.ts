import { parseBlueprintJsonArray } from "./blueprint-builder.draft";
import type { BlueprintFormDraft, BlueprintWizardStep } from "./blueprint-builder.model";
import type { PaperBlueprintSectionInput, PaperBlueprintSlotInput } from "../types";

export type BlueprintBuilderState = {
  sections: PaperBlueprintSectionInput[];
  slots: PaperBlueprintSlotInput[];
  sectionsJsonError: string | null;
  slotsJsonError: string | null;
  hasValidDifficulty: boolean;
  setupStepReady: boolean;
  structureStepReady: boolean;
  canSaveBlueprint: boolean;
  stepAvailability: Record<BlueprintWizardStep, boolean>;
};

const parseBlueprintArraySafely = <T>(label: string, source: string) => {
  try {
    return { value: parseBlueprintJsonArray<T>(label, source), error: null };
  } catch (error) {
    return {
      value: [] as T[],
      error: error instanceof Error ? error.message : `Invalid ${label.toLowerCase()} JSON`,
    };
  }
};

export function getBlueprintBuilderState(draft: BlueprintFormDraft): BlueprintBuilderState {
  const parsedSections = parseBlueprintArraySafely<PaperBlueprintSectionInput>(
    "Sections",
    draft.sectionsJson,
  );
  const parsedSlots = parseBlueprintArraySafely<PaperBlueprintSlotInput>(
    "Slots",
    draft.slotsJson,
  );
  const difficultyTotal =
    Number(draft.difficultyDistribution.easy || 0) +
    Number(draft.difficultyDistribution.normal || 0) +
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);
  const hardAdvanceTotal =
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);
  const hasValidDifficulty = difficultyTotal === 100 && hardAdvanceTotal <= 30;
  const setupStepReady =
    draft.title.trim().length > 0 &&
    draft.gradeId.trim().length > 0 &&
    draft.subjectId.trim().length > 0 &&
    Number(draft.totalMarks) > 0;
  const sectionsHaveCodes =
    parsedSections.value.length === 0 ||
    parsedSections.value.every((section) => section.code.trim().length > 0);
  const structureStepReady =
    !parsedSections.error &&
    !parsedSlots.error &&
    (draft.mode === "mcq_only" ||
      (draft.mode === "all_type" && parsedSections.value.length > 0 && sectionsHaveCodes) ||
      (draft.mode === "custom" &&
        parsedSections.value.length > 0 &&
        parsedSlots.value.length > 0 &&
        sectionsHaveCodes));
  const canSaveBlueprint = setupStepReady && hasValidDifficulty && structureStepReady;

  return {
    sections: parsedSections.value,
    slots: parsedSlots.value,
    sectionsJsonError: parsedSections.error,
    slotsJsonError: parsedSlots.error,
    hasValidDifficulty,
    setupStepReady,
    structureStepReady,
    canSaveBlueprint,
    stepAvailability: {
      setup: true,
      filters: setupStepReady,
      structure: setupStepReady && hasValidDifficulty,
      review: setupStepReady && hasValidDifficulty && structureStepReady,
    },
  };
}
