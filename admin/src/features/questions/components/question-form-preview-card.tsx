import { Badge } from "@/components/ui/badge";
import type { QuestionPreview } from "../types/question.type";
import { MathTextPreview } from "./math-text-preview";

type QuestionPreviewCardProps = {
  preview: QuestionPreview;
  title: string;
  description: string;
};

export function QuestionPreviewCard({
  preview,
  title,
  description,
}: QuestionPreviewCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/80 bg-white/90 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Variable sample
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(preview.context).length ? (
            Object.entries(preview.context).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key} = {String(value)}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-500">No variables used.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Rendered body
        </p>
        <MathTextPreview
          content={preview.body}
          emptyLabel="No rendered body available."
        />
      </div>

      {preview.options.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rendered options
          </p>
          <div className="space-y-2">
            {preview.options.map((option, index) => (
              <div
                key={`${option.label ?? "preview-option"}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-slate-700">
                  {option.label ?? String.fromCharCode(65 + index)}.
                </span>{" "}
                {option.isCorrect ? <Badge className="ml-2">Correct</Badge> : null}
                <MathTextPreview
                  content={option.text}
                  emptyLabel="No option text"
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {preview.answerText ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rendered answer
          </p>
          <MathTextPreview
            content={preview.answerText}
            emptyLabel="No rendered answer."
          />
        </div>
      ) : null}

      {preview.explanation ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rendered explanation
          </p>
          <MathTextPreview
            content={preview.explanation}
            emptyLabel="No rendered explanation."
          />
        </div>
      ) : null}
    </div>
  );
}
