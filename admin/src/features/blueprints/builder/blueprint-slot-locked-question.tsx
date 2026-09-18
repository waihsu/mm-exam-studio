import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BlueprintSlotLockedQuestionProps = {
  value: string;
  onValueChange: (value: string) => void;
  onPickQuestion: () => void;
  onClear: () => void;
};

export function BlueprintSlotLockedQuestion({
  value,
  onValueChange,
  onPickQuestion,
  onClear,
}: BlueprintSlotLockedQuestionProps) {
  return (
    <div className="space-y-2">
      <Label>Locked question</Label>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          value={value}
          onChange={(event) => onValueChange(event.target.value.trim())}
          placeholder="Optional published question id"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300/80 bg-white"
            onClick={onPickQuestion}
          >
            <Search className="mr-2 h-4 w-4" />
            Pick question
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="text-slate-600 hover:text-slate-800"
              onClick={onClear}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
