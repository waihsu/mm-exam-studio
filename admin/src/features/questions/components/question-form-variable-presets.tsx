import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VariablePreset } from "./question-form.constants";

type QuestionFormVariablePresetsProps = {
  categories: string[];
  activeCategory: string;
  presets: VariablePreset[];
  onCategoryChange: (category: string) => void;
  onApplyPreset: (preset: VariablePreset) => void;
};

export function QuestionFormVariablePresets({
  categories,
  activeCategory,
  presets,
  onCategoryChange,
  onApplyPreset,
}: QuestionFormVariablePresetsProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/80 bg-white/90 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-sky-700" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Quick start templates</h3>
          <p className="text-sm text-slate-600">Pick a preset to auto-fill the body, variables, and answer rule.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            className={activeCategory === category ? "h-8 px-3 text-xs" : "h-8 border-slate-300/80 bg-white px-3 text-xs"}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/70"
            onClick={() => onApplyPreset(preset)}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">{preset.category}</p>
            <p className="text-sm font-bold text-slate-900">{preset.label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{preset.description}</p>
            <p className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 font-mono text-xs text-slate-600">
              {preset.answerFormula ?? preset.answerText ?? "Template answer"}
            </p>
            <p className="mt-3 text-xs font-medium text-sky-700">Apply preset</p>
          </button>
        ))}
      </div>
    </div>
  );
}
