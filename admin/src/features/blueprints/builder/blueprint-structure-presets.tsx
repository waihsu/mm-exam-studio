import { Button } from "@/components/ui/button";

type BlueprintStructurePresetsProps = {
  onApplyPreset: (mode: "all_type" | "custom") => void;
  onClear: () => void;
};

export function BlueprintStructurePresets({
  onApplyPreset,
  onClear,
}: BlueprintStructurePresetsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Quick presets</p>
          <p className="text-xs text-slate-500">Start from a ready structure, then adjust visually.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onApplyPreset("all_type")}>
            Apply all-type preset
          </Button>
          <Button type="button" variant="outline" onClick={() => onApplyPreset("custom")}>
            Apply custom preset
          </Button>
          <Button type="button" variant="ghost" onClick={onClear}>
            Clear rules
          </Button>
        </div>
      </div>
    </div>
  );
}
