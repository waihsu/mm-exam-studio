import type { Dispatch, SetStateAction } from "react";
import { toast } from "@/components/ui/sonner";
import type { PaperBlueprintSectionInput, PaperBlueprintSlotInput } from "../types";
import { parseBlueprintJsonArray } from "./blueprint-builder.draft";
import type { BlueprintFormDraft } from "./blueprint-builder.model";
import {
  createAllTypePresetSections,
  createCustomPresetSections,
  createCustomPresetSlots,
  getBlueprintSectionTotalMarks,
  hasBlueprintJsonContent,
} from "./blueprint-builder.presets";

type UseBlueprintStructureEditorOptions = {
  draft: BlueprintFormDraft;
  setDraft: Dispatch<SetStateAction<BlueprintFormDraft>>;
};

export function useBlueprintStructureEditor({
  draft,
  setDraft,
}: UseBlueprintStructureEditorOptions) {
  const syncSections = (
    updater: (current: PaperBlueprintSectionInput[]) => PaperBlueprintSectionInput[],
  ) => {
    setDraft((current) => {
      const nextSections = updater(
        parseBlueprintJsonArray<PaperBlueprintSectionInput>("Sections", current.sectionsJson),
      );
      return { ...current, sectionsJson: JSON.stringify(nextSections, null, 2) };
    });
  };

  const syncSlots = (
    updater: (current: PaperBlueprintSlotInput[]) => PaperBlueprintSlotInput[],
  ) => {
    setDraft((current) => {
      const nextSlots = updater(
        parseBlueprintJsonArray<PaperBlueprintSlotInput>("Slots", current.slotsJson),
      );
      return { ...current, slotsJson: JSON.stringify(nextSlots, null, 2) };
    });
  };

  const applyBlueprintPreset = (mode: "all_type" | "custom") => {
    const hasExistingRules =
      hasBlueprintJsonContent(draft.sectionsJson) || hasBlueprintJsonContent(draft.slotsJson);
    if (
      hasExistingRules &&
      typeof window !== "undefined" &&
      !window.confirm("Apply preset and replace current sections/slots configuration?")
    ) {
      return;
    }

    const sections =
      mode === "all_type" ? createAllTypePresetSections() : createCustomPresetSections();
    const slots = mode === "custom" ? createCustomPresetSlots(sections) : [];
    setDraft((current) => ({
      ...current,
      mode,
      totalMarks: String(getBlueprintSectionTotalMarks(sections)),
      sectionsJson: JSON.stringify(sections, null, 2),
      slotsJson: JSON.stringify(slots, null, 2),
    }));
    toast.success(mode === "all_type" ? "All-type preset applied" : "Custom preset applied");
  };

  return { syncSections, syncSlots, applyBlueprintPreset };
}
