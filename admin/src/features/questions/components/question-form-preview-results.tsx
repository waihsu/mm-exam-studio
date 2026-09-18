import { QuestionPreviewCard } from "./question-form-preview-card";
import type { QuestionPreview } from "../types/question.type";

type QuestionFormPreviewResultsProps = { previews: QuestionPreview[] };

export function QuestionFormPreviewResults({ previews }: QuestionFormPreviewResultsProps) {
  if (previews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-600">
        Generate a preview to inspect the rendered output here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previews.length > 1 ? (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Rendered samples</p>
          <p className="text-sm text-slate-600">Multiple sample renders make it easier to inspect how your variables behave across different values.</p>
        </div>
      ) : null}
      <div className={previews.length > 1 ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"}>
        {previews.map((preview, index) => (
          <QuestionPreviewCard
            key={`preview-result-${index}`}
            preview={preview}
            title={previews.length > 1 ? `Rendered sample ${index + 1}` : "Rendered sample"}
            description={previews.length > 1 ? "Generated from the current variable rules." : "This sample uses your manual preview values when provided."}
          />
        ))}
      </div>
    </div>
  );
}
