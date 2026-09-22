import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  blueprintDifficultyOptions,
  blueprintMarkOptions,
  blueprintQuestionTypeOptions,
} from "./blueprint-builder.constants";
import type {
  PaperBlueprintDifficulty,
  PaperBlueprintQuestionType,
  PaperBlueprintSectionInput,
  PaperBlueprintSlotInput,
} from "../types";

type BlueprintSlotConstraintsProps = {
  slot: PaperBlueprintSlotInput;
  sections: PaperBlueprintSectionInput[];
  onChange: (update: Partial<PaperBlueprintSlotInput>) => void;
};

export function BlueprintSlotConstraints({
  slot,
  sections,
  onChange,
}: BlueprintSlotConstraintsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-2">
        <Label>Slot no.</Label>
        <Input
          type="number"
          min={1}
          value={slot.slotNumber}
          onChange={(event) => onChange({ slotNumber: Math.max(1, Number(event.target.value || 1)) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Section</Label>
        <Select
          value={slot.sectionCode ?? "__none__"}
          onValueChange={(value) => onChange({ sectionCode: value === "__none__" ? undefined : value })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Optional</SelectItem>
            {sections.map((section) => <SelectItem key={section.code} value={section.code}>{section.code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={slot.questionType}
          onValueChange={(value) => onChange({ questionType: value as PaperBlueprintQuestionType })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {blueprintQuestionTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Marks</Label>
        <Select
          value={String(slot.marks)}
          onValueChange={(value) => onChange({ marks: Number(value) as 1 | 2 | 3 | 5 | 10 })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {blueprintMarkOptions.map((mark) => <SelectItem key={mark} value={String(mark)}>{mark}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select
          value={slot.difficultyTarget ?? "__none__"}
          onValueChange={(value) => onChange({
            difficultyTarget: value === "__none__" ? undefined : value as PaperBlueprintDifficulty,
          })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Optional</SelectItem>
            {blueprintDifficultyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Swap limit</Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={slot.swapLimit ?? 3}
          onChange={(event) => onChange({
            swapLimit: Math.min(10, Math.max(1, Number(event.target.value || 3))),
          })}
        />
      </div>
    </div>
  );
}
