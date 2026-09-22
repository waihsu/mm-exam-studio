import type { Dispatch, SetStateAction } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blueprintDifficultyPresets, blueprintPlanOptions } from "./blueprint-builder.constants";
import type { BlueprintFormDraft } from "./blueprint-builder.model";
import type { QuestionChapter, QuestionSubChapter } from "@/features/questions/types/question.type";
import { cn } from "@/lib/utils";

type BlueprintBuilderFiltersStepProps = {
  draft: BlueprintFormDraft;
  onDraftChange: Dispatch<SetStateAction<BlueprintFormDraft>>;
  chapters: QuestionChapter[];
  subChapters: QuestionSubChapter[];
  onChapterToggle: (chapterId: string, checked: boolean) => void;
  onSubChapterToggle: (subChapterId: string, checked: boolean) => void;
};

export function BlueprintBuilderFiltersStep({
  draft,
  onDraftChange,
  chapters,
  subChapters,
  onChapterToggle,
  onSubChapterToggle,
}: BlueprintBuilderFiltersStepProps) {
  const difficultyTotal =
    Number(draft.difficultyDistribution.easy || 0) +
    Number(draft.difficultyDistribution.normal || 0) +
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);
  const hardAdvanceTotal =
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Difficulty distribution</p>
            <p className="text-xs text-slate-500">
              Must total 100%. Hard + advance must stay at 30% or below.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Total: {difficultyTotal}%</p>
            <p>Hard + advance: {hardAdvanceTotal}%</p>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {blueprintDifficultyPresets.map((preset) => {
            const isActive = (
              Object.keys(preset.values) as Array<keyof typeof preset.values>
            ).every((bucket) => draft.difficultyDistribution[bucket] === preset.values[bucket]);
            return (
              <Button
                key={preset.key}
                type="button"
                variant="outline"
                className={cn(
                  "rounded-full bg-white",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100",
                )}
                onClick={() =>
                  onDraftChange((current) => ({
                    ...current,
                    difficultyDistribution: { ...preset.values },
                  }))
                }
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(draft.difficultyDistribution) as Array<
            keyof BlueprintFormDraft["difficultyDistribution"]
          >).map((bucket) => (
            <div key={bucket} className="space-y-2">
              <Label className="capitalize">{bucket}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.difficultyDistribution[bucket]}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    difficultyDistribution: {
                      ...current.difficultyDistribution,
                      [bucket]: event.target.value,
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Preset chapters</p>
            <p className="text-xs text-slate-500">Optional filter for auto-generated sections.</p>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {chapters.length === 0 ? (
              <p className="text-sm text-slate-500">Pick grade and subject first.</p>
            ) : (
              chapters.map((chapter) => {
                const checked = draft.presetChapterIds.includes(chapter.id);
                return (
                  <label
                    key={chapter.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        onChapterToggle(chapter.id, nextChecked === true)
                      }
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{chapter.name}</span>
                      <span className="text-xs text-slate-500">{chapter.code ?? "No code"}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Preset lessons</p>
            <p className="text-xs text-slate-500">Optional lesson filter inside selected chapters.</p>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {subChapters.length === 0 ? (
              <p className="text-sm text-slate-500">Select one or more chapters first.</p>
            ) : (
              subChapters.map((subChapter) => {
                const checked = draft.presetSubChapterIds.includes(subChapter.id);
                return (
                  <label
                    key={subChapter.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        onSubChapterToggle(subChapter.id, nextChecked === true)
                      }
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{subChapter.name}</span>
                      <span className="text-xs text-slate-500">{subChapter.code ?? "No code"}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={draft.includeAnswerPaper}
              onCheckedChange={(checked) =>
                onDraftChange((current) => ({
                  ...current,
                  includeAnswerPaper: checked === true,
                }))
              }
            />
            <span>
              <span className="block font-medium text-slate-900">Include answer paper by default</span>
              <span className="text-xs text-slate-500">
                Materialized papers will request question + answer output together.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={draft.publishToUsers}
              onCheckedChange={(checked) =>
                onDraftChange((current) => ({
                  ...current,
                  publishToUsers: checked === true,
                  status: checked === true && current.status !== "ready" ? "ready" : current.status,
                  availablePlanCodes: checked === true ? current.availablePlanCodes : [],
                }))
              }
            />
            <span>
              <span className="block font-medium text-slate-900">Publish as reusable template</span>
              <span className="text-xs text-slate-500">Users will see this as a ready-made template.</span>
            </span>
          </label>

          {draft.publishToUsers ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                Published templates are forced to <span className="font-semibold">Ready</span> status.
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {blueprintPlanOptions.map((plan) => {
                  const checked = draft.availablePlanCodes.includes(plan.value);
                  return (
                    <label
                      key={plan.value}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          onDraftChange((current) => ({
                            ...current,
                            availablePlanCodes:
                              nextChecked === true
                                ? [...new Set([...current.availablePlanCodes, plan.value])]
                                : current.availablePlanCodes.filter((value) => value !== plan.value),
                          }))
                        }
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{plan.label}</span>
                        <span className="text-xs text-slate-500">{plan.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
