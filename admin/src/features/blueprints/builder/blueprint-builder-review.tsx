import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import type { BlueprintFormDraft, BlueprintWizardStep } from "./blueprint-builder.model";
import { blueprintModeLabel, blueprintStatusLabel } from "../utils/blueprint-display";
import { cn } from "@/lib/utils";

type BlueprintBuilderReviewProps = {
  draft: BlueprintFormDraft;
  step: BlueprintWizardStep;
  sectionCount: number;
  slotCount: number;
  setupReady: boolean;
  difficultyValid: boolean;
  structureReady: boolean;
  canSave: boolean;
  editing: boolean;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export function BlueprintBuilderReview({
  draft,
  step,
  sectionCount,
  slotCount,
  setupReady,
  difficultyValid,
  structureReady,
  canSave,
  editing,
  saving,
  onPrevious,
  onNext,
  onCancel,
  onSave,
}: BlueprintBuilderReviewProps) {
  return (
    <>
      {step === "review" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Blueprint summary</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Title:</span> {draft.title || "Untitled"}</p>
              <p><span className="font-medium text-slate-900">Mode:</span> {blueprintModeLabel[draft.mode]}</p>
              <p><span className="font-medium text-slate-900">Status:</span> {blueprintStatusLabel[draft.status]}</p>
              <p><span className="font-medium text-slate-900">Total marks:</span> {draft.totalMarks}</p>
              <p><span className="font-medium text-slate-900">PDF style:</span> {draft.pdfTemplateKey === "myanmar_matric" ? "Myanmar Matric" : "Default"}</p>
              {draft.examYearLabel ? <p><span className="font-medium text-slate-900">Exam year:</span> {draft.examYearLabel}</p> : null}
              {draft.timeAllowedLabel ? <p><span className="font-medium text-slate-900">Time allowed:</span> {draft.timeAllowedLabel}</p> : null}
              <p><span className="font-medium text-slate-900">Sections:</span> {sectionCount}</p>
              <p><span className="font-medium text-slate-900">Slots:</span> {slotCount}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Readiness check</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className={cn(setupReady ? "text-emerald-700" : "text-rose-700")}>Setup: {setupReady ? "ready" : "missing required fields"}</p>
              <p className={cn(difficultyValid ? "text-emerald-700" : "text-rose-700")}>Filters: {difficultyValid ? "difficulty rules valid" : "difficulty rules need adjustment"}</p>
              <p className={cn(structureReady ? "text-emerald-700" : "text-rose-700")}>Structure: {structureReady ? "structure is complete" : "sections or slots still need setup"}</p>
              <p className={cn(canSave ? "text-emerald-700" : "text-rose-700")}>Save: {canSave ? "ready to save" : "cannot save yet"}</p>
            </div>
          </div>
        </div>
      ) : null}

      {step === "review" && !canSave ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Complete required fields before saving</AlertTitle>
          <AlertDescription>
            Title, grade, subject, valid difficulty percentages, and valid sections/slots configuration are required.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {step !== "setup" ? <Button variant="outline" type="button" onClick={onPrevious}>Back</Button> : null}
          {step !== "review" ? <Button type="button" onClick={onNext}>Next</Button> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          {step === "review" ? (
            <Button disabled={saving || !canSave} onClick={onSave}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editing ? "Save changes" : "Create blueprint"}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
