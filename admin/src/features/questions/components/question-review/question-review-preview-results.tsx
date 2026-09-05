import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { QuestionReviewPreviewCard } from "./question-review-preview-card";
import type { QuestionRecord } from "../../types/question.type";

type PreviewResult = Parameters<typeof QuestionReviewPreviewCard>[0]["preview"];

type QuestionReviewPreviewResultsProps = {
  questionMode: QuestionRecord["mode"];
  previews: PreviewResult[];
  isRendering: boolean;
  error: Error | null;
};

export function QuestionReviewPreviewResults({
  questionMode,
  previews,
  isRendering,
  error,
}: QuestionReviewPreviewResultsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/92 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Rendered samples</h3>
          <p className="text-sm text-slate-600">
            {questionMode === "variable"
              ? "Inspect several generated samples to catch formula or placeholder mistakes early."
              : "Check one final render before publishing or editing."}
          </p>
        </div>
        {isRendering ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" />
            Rendering...
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview unavailable</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : previews.length ? (
        <div className={previews.length > 1 ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"}>
          {previews.map((preview, index) => (
            <QuestionReviewPreviewCard
              key={`review-preview-${index}`}
              preview={preview}
              title={previews.length > 1 ? `Sample ${index + 1}` : "Rendered sample"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No preview samples yet.
        </div>
      )}
    </div>
  );
}
