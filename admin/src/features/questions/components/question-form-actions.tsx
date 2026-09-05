import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuestionFormActionsProps = {
  previewEnabled: boolean;
  previewing: boolean;
  submitting: boolean;
  variableMode: boolean;
  submitLabel: string;
  submitHint: string;
  onPreview: () => void;
};

export function QuestionFormActions({
  previewEnabled,
  previewing,
  submitting,
  variableMode,
  submitLabel,
  submitHint,
  onPreview,
}: QuestionFormActionsProps) {
  return (
    <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{submitHint}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {previewEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300/80 bg-white sm:w-auto"
              disabled={previewing || submitting}
              onClick={onPreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewing ? "Generating..." : variableMode ? "Generate samples" : "Generate preview"}
            </Button>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Saving question..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
