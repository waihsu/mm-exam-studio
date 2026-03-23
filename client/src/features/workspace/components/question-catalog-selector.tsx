import { CheckCircle2, Lock, SearchX } from "lucide-react";
import { MathRichText } from "shared";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import type {
  WorkspaceCatalogLockedQuestion,
  WorkspaceCatalogQuestion,
} from "../types";

type Props = {
  rows: WorkspaceCatalogQuestion[];
  lockedRows?: WorkspaceCatalogLockedQuestion[];
  lockedTotal?: number;
  selectedIds: string[];
  onToggle: (questionId: string) => void;
};

type CatalogQuestionType =
  | WorkspaceCatalogQuestion["type"]
  | WorkspaceCatalogLockedQuestion["type"];
type CatalogDifficulty =
  | WorkspaceCatalogQuestion["difficulty"]
  | WorkspaceCatalogLockedQuestion["difficulty"];

const typeLabel: Record<CatalogQuestionType, string> = {
  mcq: "MCQ",
  true_false: "True/False",
  short_answer: "Short Answer",
  fill_blank: "Fill Blank",
  matching: "Matching",
};

const difficultyLabel: Record<CatalogDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const difficultyTone: Record<CatalogDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-rose-100 text-rose-800",
};

export function QuestionCatalogSelector({
  rows,
  lockedRows = [],
  lockedTotal = 0,
  selectedIds,
  onToggle,
}: Props) {
  const selectedSet = new Set(selectedIds);

  if (rows.length === 0 && lockedRows.length === 0) {
    return (
      <EmptyState
        title="No questions matched"
        description="Try changing filters or searching with a broader keyword."
        icon={SearchX}
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {rows.map((question) => {
        const isSelected = selectedSet.has(question.id);
        const headline = question.title?.trim() || question.bodyPreview;
        const tags = [
          question.grade.name,
          question.subject.name,
          question.chapter?.name,
          question.subChapter?.name,
        ].filter(Boolean);
        const visibleTags = tags.slice(0, 3);
        const hiddenTagsCount = Math.max(0, tags.length - visibleTags.length);

        return (
          <button
            key={question.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(question.id)}
            className={`hover-lift w-full rounded-xl border p-4 text-left transition sm:p-5 ${
              isSelected
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="max-w-full truncate rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:px-3">
                    {question.questionCode}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                    {typeLabel[question.type]}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                    {question.marks} Mark{question.marks > 1 ? "s" : ""}
                  </span>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isSelected ? "Added" : "Select"}
                </div>
              </div>

              <div className="text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
                <MathRichText content={headline} textClassName="line-clamp-2 text-slate-900" />
              </div>

              <MathRichText
                content={question.bodyPreview}
                className="text-left"
                textClassName="line-clamp-3 text-sm leading-6 text-slate-600"
              />

              <div className="flex flex-wrap items-center gap-2">
                {question.isFreePreview ? (
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800 sm:px-3">
                    Free
                  </span>
                ) : null}
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:px-3 ${difficultyTone[question.difficulty]}`}
                >
                  {difficultyLabel[question.difficulty]}
                </span>
                {question.estimatedTimeSec ? (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                    ~{Math.max(1, Math.round(question.estimatedTimeSec / 60))} min
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {visibleTags.map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
                {hiddenTagsCount > 0 ? (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    +{hiddenTagsCount} more
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}

      {lockedRows.length > 0 ? (
        <div className="space-y-3 pt-2">
          <Notice tone="warning" className="text-xs">
            {lockedTotal > lockedRows.length
              ? `${lockedTotal} questions are locked for this plan. Showing ${lockedRows.length}.`
              : `${lockedRows.length} question${lockedRows.length > 1 ? "s are" : " is"} locked for this plan.`}
          </Notice>
          {lockedRows.map((question) => {
            const tags = [
              question.grade.name,
              question.subject.name,
              question.chapter?.name,
              question.subChapter?.name,
            ].filter(Boolean);
            const visibleTags = tags.slice(0, 3);
            const hiddenTagsCount = Math.max(0, tags.length - visibleTags.length);

            return (
              <Notice
                tone="warning"
                key={`locked-${question.id}`}
                className="w-full p-4 text-left sm:p-5"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="max-w-full truncate rounded-md bg-slate-700 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:px-3">
                        {question.questionCode}
                      </span>
                      <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                        {typeLabel[question.type]}
                      </span>
                      <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                        {question.marks} Mark{question.marks > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-amber-900">{question.lockReason}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {question.isFreePreview ? (
                      <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800 sm:px-3">
                        Free
                      </span>
                    ) : null}
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:px-3 ${difficultyTone[question.difficulty]}`}
                    >
                      {difficultyLabel[question.difficulty]}
                    </span>
                    {question.estimatedTimeSec ? (
                      <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 sm:px-3">
                        ~{Math.max(1, Math.round(question.estimatedTimeSec / 60))} min
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {visibleTags.map((item) => (
                      <span
                        key={`locked-tag-${question.id}-${item}`}
                        className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                    {hiddenTagsCount > 0 ? (
                      <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        +{hiddenTagsCount} more
                      </span>
                    ) : null}
                  </div>
                </div>
              </Notice>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
