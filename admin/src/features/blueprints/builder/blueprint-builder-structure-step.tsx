import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import type { QuestionChapter, QuestionMeta } from "@/features/questions/types/question.type";
import { getBlueprintSubChaptersForSingleChapter } from "./blueprint-builder.presets";
import type { BlueprintFormDraft } from "./blueprint-builder.model";
import { BlueprintEditorEmptyState } from "./blueprint-editor-empty-state";
import { BlueprintSectionEditor } from "./blueprint-section-editor";
import { BlueprintSlotConstraints } from "./blueprint-slot-constraints";
import { BlueprintSlotEditorHeader } from "./blueprint-slot-editor-header";
import { BlueprintSlotLockedQuestion } from "./blueprint-slot-locked-question";
import { BlueprintSlotTaxonomyFilters } from "./blueprint-slot-taxonomy-filters";
import { BlueprintStructurePresets } from "./blueprint-structure-presets";
import type { PaperBlueprintSectionInput, PaperBlueprintSlotInput } from "../types";

type BlueprintBuilderStructureStepProps = {
  draft: BlueprintFormDraft;
  sections: PaperBlueprintSectionInput[];
  slots: PaperBlueprintSlotInput[];
  meta: QuestionMeta | undefined;
  chapters: QuestionChapter[];
  onApplyPreset: (mode: "all_type" | "custom") => void;
  onClear: () => void;
  onSectionsChange: (
    updater: (current: PaperBlueprintSectionInput[]) => PaperBlueprintSectionInput[],
  ) => void;
  onSlotsChange: (
    updater: (current: PaperBlueprintSlotInput[]) => PaperBlueprintSlotInput[],
  ) => void;
  onPickLockedQuestion: (slotIndex: number) => void;
};

export function BlueprintBuilderStructureStep({
  draft,
  sections,
  slots,
  meta,
  chapters,
  onApplyPreset,
  onClear,
  onSectionsChange,
  onSlotsChange,
  onPickLockedQuestion,
}: BlueprintBuilderStructureStepProps) {
  const showSectionBuilder = draft.mode !== "mcq_only";
  const showSlotBuilder = draft.mode === "custom";

  return (
    <div className="space-y-4">
      <BlueprintStructurePresets onApplyPreset={onApplyPreset} onClear={onClear} />

      {showSectionBuilder ? (
        <BlueprintSectionEditor sections={sections} onSectionsChange={onSectionsChange} />
      ) : null}

      {showSlotBuilder ? (
        <PagePanel className="space-y-4 bg-white/92">
          <BlueprintSlotEditorHeader
            nextSlotNumber={slots.length + 1}
            defaultSectionCode={sections[0]?.code}
            onAddSlot={(slot) => onSlotsChange((current) => [...current, slot])}
          />

          {slots.length === 0 ? (
            <BlueprintEditorEmptyState>
              No slots yet. Add one or apply the custom preset.
            </BlueprintEditorEmptyState>
          ) : (
            <div className="space-y-4">
              {slots.map((slot, index) => {
                const subChapters = getBlueprintSubChaptersForSingleChapter(
                  meta,
                  slot.chapterId ?? "",
                );

                return (
                  <div
                    key={`${slot.slotNumber}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">Slot {slot.slotNumber}</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() =>
                          onSlotsChange((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <BlueprintSlotConstraints
                      slot={slot}
                      sections={sections}
                      onChange={(update) =>
                        onSlotsChange((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, ...update } : item,
                          ),
                        )
                      }
                    />

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <BlueprintSlotTaxonomyFilters
                        slot={slot}
                        chapters={chapters}
                        subChapters={subChapters}
                        onChapterChange={(chapterId) =>
                          onSlotsChange((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, chapterId, subChapterId: undefined }
                                : item,
                            ),
                          )
                        }
                        onSubChapterChange={(subChapterId) =>
                          onSlotsChange((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, subChapterId } : item,
                            ),
                          )
                        }
                      />
                      <BlueprintSlotLockedQuestion
                        value={slot.lockedQuestionId ?? ""}
                        onValueChange={(value) =>
                          onSlotsChange((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, lockedQuestionId: value || undefined }
                                : item,
                            ),
                          )
                        }
                        onPickQuestion={() => onPickLockedQuestion(index)}
                        onClear={() =>
                          onSlotsChange((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, lockedQuestionId: undefined } : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PagePanel>
      ) : null}
    </div>
  );
}
