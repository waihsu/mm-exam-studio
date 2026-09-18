import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaperBlueprintMode, PaperBlueprintStatus } from "../types";
import { blueprintModeGuidance } from "./blueprint-builder.constants";
import {
  blueprintWizardSteps,
  type BlueprintWizardStep,
} from "./blueprint-builder.model";
import { blueprintStatusLabel, blueprintStatusTone } from "../utils/blueprint-display";
import { cn } from "@/lib/utils";

type BlueprintBuilderHeaderProps = {
  editing: boolean;
  mode: PaperBlueprintMode;
  status: PaperBlueprintStatus;
  activeStep: BlueprintWizardStep;
  stepAvailability: Record<BlueprintWizardStep, boolean>;
  onBack: () => void;
  onStepChange: (step: BlueprintWizardStep) => void;
};

export function BlueprintBuilderHeader({
  editing,
  mode,
  status,
  activeStep,
  stepAvailability,
  onBack,
  onStepChange,
}: BlueprintBuilderHeaderProps) {
  const guidance = blueprintModeGuidance[mode];

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Blueprint builder
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {editing ? "Edit blueprint" : "New blueprint"}
          </h2>
          <p className="text-sm text-slate-600">
            Full-page builder for setup, difficulty, structure, and final review.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back to list</Button>
          <Badge variant="outline" className={blueprintStatusTone[status]}>
            {blueprintStatusLabel[status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {blueprintWizardSteps.map((step, index) => {
          const active = activeStep === step.key;
          const enabled = stepAvailability[step.key];
          return (
            <button
              key={step.key}
              type="button"
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : enabled
                    ? "border-slate-200 bg-white text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-400",
              )}
              disabled={!enabled}
              onClick={() => onStepChange(step.key)}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{step.label}</p>
              <p className="mt-1 text-xs opacity-80">{step.description}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3">
        <p className="text-sm font-semibold text-sky-950">{guidance.title}</p>
        <p className="mt-1 text-xs text-sky-800">{guidance.description}</p>
      </div>
    </>
  );
}
