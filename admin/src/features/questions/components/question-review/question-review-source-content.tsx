import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MathTextPreview } from "../math-text-preview";
import type { QuestionRecord } from "../../types/question.type";

type QuestionReviewSourceContentProps = {
  question: QuestionRecord;
};

export function QuestionReviewSourceContent({ question }: QuestionReviewSourceContentProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-900">Source content</h3>
      </div>

      <ReviewContentSection label="Question body">
        <MathTextPreview content={question.body} emptyLabel="No question body." />
      </ReviewContentSection>

      {question.options.length ? (
        <ReviewContentSection label="Options">
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div
                key={option.id ?? `${option.label ?? "option"}-${index}`}
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
        </ReviewContentSection>
      ) : null}

      {question.answerText ? (
        <ReviewContentSection label="Answer text">
          <MathTextPreview content={question.answerText} emptyLabel="No answer text." />
        </ReviewContentSection>
      ) : null}

      {question.answerFormula ? (
        <ReviewContentSection label="Answer formula">
          <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 font-mono text-sm text-slate-700">
            {question.answerFormula}
          </div>
        </ReviewContentSection>
      ) : null}

      {question.explanation ? (
        <ReviewContentSection label="Explanation">
          <MathTextPreview content={question.explanation} emptyLabel="No explanation." />
        </ReviewContentSection>
      ) : null}
    </div>
  );
}

function ReviewContentSection({
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
