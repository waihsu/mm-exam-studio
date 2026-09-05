import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { typeLabels } from "./question-form.constants";
import type { QuestionInput } from "../schema/question.schema";
import type { QuestionType } from "../types/question.type";

type QuestionFormCoreSetupProps = {
  form: QuestionInput;
  markOptions: readonly number[];
  onQuestionCodeChange: (value: string) => void;
  onModeChange: (mode: QuestionInput["mode"]) => void;
  onTypeChange: (type: QuestionType) => void;
  onDifficultyChange: (difficulty: QuestionInput["difficulty"]) => void;
  onMarksChange: (marks: number) => void;
  onMarksBlur: () => void;
  onMarkSelect: (marks: number) => void;
};

export function QuestionFormCoreSetup({
  form,
  markOptions,
  onQuestionCodeChange,
  onModeChange,
  onTypeChange,
  onDifficultyChange,
  onMarksChange,
  onMarksBlur,
  onMarkSelect,
}: QuestionFormCoreSetupProps) {
  return (
    <div id="question-setup" className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Core setup</p>
        <p className="text-sm text-slate-600">
          Define code, delivery mode, and difficulty before writing the content.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="question-code">Question code</Label>
          <Input
            id="question-code"
            value={form.questionCode}
            onChange={(event) => onQuestionCodeChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select value={form.mode} onValueChange={(value) => onModeChange(value as QuestionInput["mode"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static question</SelectItem>
              <SelectItem value="variable">Variable question</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(value) => onTypeChange(value as QuestionType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={form.difficulty}
            onValueChange={(value) => onDifficultyChange(value as QuestionInput["difficulty"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            type="number"
            min={1}
            step={1}
            value={form.marks}
            onChange={(event) => onMarksChange(Number(event.target.value || 1))}
            onBlur={onMarksBlur}
          />
          <div className="flex flex-wrap gap-2">
            {markOptions.map((mark) => (
              <Button
                key={mark}
                type="button"
                variant={form.marks === mark ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => onMarkSelect(mark)}
              >
                {mark} marks
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
