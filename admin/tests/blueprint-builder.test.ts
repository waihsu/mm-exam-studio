import { describe, expect, it } from "bun:test";
import {
  buildBlueprintSubmitInput,
  parseBlueprintJsonArray,
  validateBlueprintDraftBeforeSubmit,
} from "../src/features/blueprints/builder/blueprint-builder.draft";
import { createEmptyDraft } from "../src/features/blueprints/builder/blueprint-builder.model";
import { getBlueprintBuilderState } from "../src/features/blueprints/builder/blueprint-builder-state";
import { getBlueprintNextStep } from "../src/features/blueprints/builder/blueprint-builder-navigation";
import {
  createAllTypePresetSections,
  createCustomPresetSections,
  createCustomPresetSlots,
  getBlueprintSectionTotalMarks,
} from "../src/features/blueprints/builder/blueprint-builder.presets";

describe("blueprint builder draft utilities", () => {
  it("converts a valid draft into the API input shape", () => {
    const draft = {
      ...createEmptyDraft(),
      title: "  Grade 12 Midterm  ",
      gradeId: "grade-12",
      subjectId: "math",
      examYearLabel: " 2026 ",
      sectionsJson: JSON.stringify(createAllTypePresetSections()),
    };

    const input = validateBlueprintDraftBeforeSubmit(draft);

    expect(input.title).toBe("Grade 12 Midterm");
    expect(input.examYearLabel).toBe("2026");
    expect(input.sections).toHaveLength(6);
    expect(input.difficultyDistribution).toEqual({
      easy: 40,
      normal: 30,
      hard: 20,
      advance: 10,
    });
  });

  it("rejects invalid difficulty distribution before an API request", () => {
    const draft = {
      ...createEmptyDraft(),
      title: "Blueprint",
      gradeId: "grade-12",
      subjectId: "math",
      difficultyDistribution: { easy: "40", normal: "30", hard: "25", advance: "10" },
    };

    expect(() => validateBlueprintDraftBeforeSubmit(draft)).toThrow(
      "Difficulty distribution must total exactly 100%.",
    );
  });

  it("creates deterministic custom slots from custom preset sections", () => {
    const sections = createCustomPresetSections();
    const slots = createCustomPresetSlots(sections);

    expect(slots).toHaveLength(23);
    expect(slots[0]).toMatchObject({ slotNumber: 1, sectionCode: "A", difficultyTarget: "easy" });
    expect(slots[3]).toMatchObject({ slotNumber: 4, difficultyTarget: "advance" });
    expect(getBlueprintSectionTotalMarks(sections)).toBe(50);
  });

  it("rejects a JSON object where an array is required", () => {
    expect(() => parseBlueprintJsonArray("Slots", "{}"))
      .toThrow("Slots must be a JSON array.");
  });

  it("keeps API mapping usable independently from form validation", () => {
    const draft = {
      ...createEmptyDraft(),
      title: "Ready input",
      gradeId: "grade-12",
      subjectId: "science",
      totalMarks: "50.9",
    };

    expect(buildBlueprintSubmitInput(draft).totalMarks).toBe(50);
  });

  it("only unlocks later wizard steps when each prerequisite is valid", () => {
    const incomplete = getBlueprintBuilderState(createEmptyDraft());
    expect(incomplete.stepAvailability).toEqual({
      setup: true,
      filters: false,
      structure: false,
      review: false,
    });

    const allTypeDraft = {
      ...createEmptyDraft(),
      title: "Grade 12 Midterm",
      gradeId: "grade-12",
      subjectId: "math",
      mode: "all_type" as const,
      sectionsJson: JSON.stringify(createAllTypePresetSections()),
    };
    const ready = getBlueprintBuilderState(allTypeDraft);

    expect(ready.canSaveBlueprint).toBe(true);
    expect(ready.stepAvailability.review).toBe(true);
  });

  it("keeps custom mode locked until it has sections and slots", () => {
    const draft = {
      ...createEmptyDraft(),
      title: "Custom paper",
      gradeId: "grade-12",
      subjectId: "science",
      mode: "custom" as const,
      sectionsJson: JSON.stringify(createCustomPresetSections()),
    };

    expect(getBlueprintBuilderState(draft).structureStepReady).toBe(false);
  });

  it("reports the blocked prerequisite before moving the wizard forward", () => {
    expect(
      getBlueprintNextStep({
        activeStep: "setup",
        setupStepReady: false,
        hasValidDifficulty: true,
        structureStepReady: true,
      }),
    ).toEqual({ issue: "setup-incomplete" });

    expect(
      getBlueprintNextStep({
        activeStep: "filters",
        setupStepReady: true,
        hasValidDifficulty: true,
        structureStepReady: true,
      }),
    ).toEqual({ nextStep: "structure" });
  });
});
