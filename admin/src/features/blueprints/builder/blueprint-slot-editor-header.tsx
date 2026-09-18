import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaperBlueprintSlotInput } from "../types";

type BlueprintSlotEditorHeaderProps = {
  onAddSlot: (slot: PaperBlueprintSlotInput) => void;
  nextSlotNumber: number;
  defaultSectionCode: string | undefined;
};

export function BlueprintSlotEditorHeader({
  onAddSlot,
  nextSlotNumber,
  defaultSectionCode,
}: BlueprintSlotEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">Slots</h3>
        <p className="text-sm text-slate-500">Define exact slot targets for custom papers.</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onAddSlot({
            slotNumber: nextSlotNumber,
            sectionCode: defaultSectionCode,
            questionType: "mcq",
            marks: 1,
            swapLimit: 3,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add slot
      </Button>
    </div>
  );
}
