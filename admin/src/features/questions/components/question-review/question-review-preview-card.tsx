import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { MathTextPreview } from "../math-text-preview";
import type { QuestionPreview } from "../../types/question.type";

type QuestionReviewPreviewCardProps = {
  preview: QuestionPreview;
  title: string;
};

export function QuestionReviewPreviewCard({
  preview,
  title,
}: QuestionReviewPreviewCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
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

      <PreviewSection label="Body">
        <MathTextPreview content={preview.body} emptyLabel="No rendered body." />
      </PreviewSection>

      {preview.options.length ? (
        <PreviewSection label="Options">
          <div className="space-y-2">
            {preview.options.map((option, index) => (
              <div
                key={`${option.label ?? "option"}-${index}`}
                className="rounded-xl border border-white/80 bg-white/90 px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    {option.label ?? String.fromCharCode(65 + index)}.
                  </span>
                  {option.isCorrect ? <Badge>Correct</Badge> : null}
                </div>
                <MathTextPreview
                  content={option.text}
                  emptyLabel="No option text."
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {preview.answerText ? (
        <PreviewSection label="Answer">
          <MathTextPreview content={preview.answerText} emptyLabel="No rendered answer." />
        </PreviewSection>
      ) : null}

      {preview.explanation ? (
        <PreviewSection label="Explanation">
          <MathTextPreview content={preview.explanation} emptyLabel="No rendered explanation." />
        </PreviewSection>
      ) : null}
    </div>
  );
}

function PreviewSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}
