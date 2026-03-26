import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";
import { QuestionMixPanel } from "@/features/workspace/components/question-mix-panel";
import { QuestionScopePanel } from "@/features/workspace/components/question-scope-panel";
import { usePracticeBuilderPageData } from "../hooks/use-practice-builder-page-data";
import { QuickStat, SummaryRow } from "./practice-shared";

const PRACTICE_MIX_ITEMS = [
  { type: "mcq", label: "MCQ", helperText: "Set 0 to leave this type out." },
  { type: "true_false", label: "True/False", helperText: "Use 0 if you do not need quick binary checks." },
  { type: "fill_blank", label: "Fill Blank", helperText: "Good for short recall checks." },
  { type: "short_answer", label: "Short Answer", helperText: "Use this for brief written responses." },
  { type: "matching", label: "Matching", helperText: "Use 0 to skip matching in this session." },
] as const;

export function PracticeBuilderPage() {
  const {
    filters,
    metaQuery,
    countsQuery,
    sessionsQuery,
    createSessionMutation,
    meta,
    counts,
    sessions,
    summary,
    planCode,
    questionLimit,
    mixCounts,
    configuredMixCount,
    activeMixTypes,
    activeSessionsCount,
    exceedsLimit,
    exceedsAvailableMix,
    countValue,
    updateFilters,
    setMixCount,
    clearMix,
    setCountValue,
    startPractice,
  } = usePracticeBuilderPageData();

  const fallbackCount = Math.max(1, Number.parseInt(countValue || "10", 10) || 10);
  const totalPlanned = configuredMixCount > 0 ? configuredMixCount : fallbackCount;
  const canStart =
    totalPlanned > 0 &&
    totalPlanned <= 50 &&
    !exceedsLimit &&
    !exceedsAvailableMix &&
    !createSessionMutation.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Practice"
        title="Practice Builder"
        description="Use one mini blueprint flow for both scope and question mix."
        actions={
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[260px] sm:gap-3">
            <QuickStat label="Planned" value={String(totalPlanned)} />
            <QuickStat label="Types" value={String(activeMixTypes)} />
            <QuickStat label="Active" value={String(activeSessionsCount)} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <QuestionScopePanel
            meta={meta}
            planCode={planCode}
            value={filters}
            onChange={updateFilters}
            title="Practice Scope"
            hint="Choose the syllabus scope once, then use the mini blueprint to set exact practice counts."
          />

          <QuestionMixPanel
            title="Mini Blueprint"
            hint="Set exact counts by question type. Leave every row at 0 to use the fallback count below."
            items={PRACTICE_MIX_ITEMS.map((item) => ({ ...item }))}
            values={mixCounts}
            onChange={setMixCount}
            totalPlanned={configuredMixCount}
            availableCounts={counts}
            unavailableMessage={
              exceedsAvailableMix
                ? "One or more requested question types exceed the available questions in this scope."
                : null
            }
          />

          <SectionCard
            title="Quick Start"
            description="Use the fallback count only when every mini blueprint row stays at 0."
            actions={
              <button
                type="button"
                onClick={clearMix}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Clear mix
              </button>
            }
          >
            {configuredMixCount === 0 ? (
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Question count
                </span>
                <input
                  value={countValue}
                  onChange={(event) =>
                    setCountValue(event.target.value.replace(/[^\d]/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900 sm:max-w-[180px]"
                />
              </label>
            ) : (
              <Notice tone="info">
                The exact mix above will be used for this session.
              </Notice>
            )}

            {countsQuery.data && !countsQuery.data.ok ? (
              <Notice tone="error">
                {countsQuery.data.message}
              </Notice>
            ) : null}
            {createSessionMutation.data && !createSessionMutation.data.ok ? (
              <Notice tone="error">
                {createSessionMutation.data.message}
              </Notice>
            ) : null}
            {planCode === "free" ? (
              <Notice tone="warning">
                Free plan can use free preview chapters and lessons only, up to {questionLimit ?? 0} questions per practice session.
              </Notice>
            ) : null}
            {exceedsLimit ? (
              <Notice tone="error">
                Reduce this session to {questionLimit} questions or fewer for your current plan.
              </Notice>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={!canStart}
                onClick={() => {
                  void startPractice();
                }}
              >
                {createSessionMutation.isPending ? "Starting..." : "Start practice"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-slate-500">
                Planned session: {totalPlanned} question{totalPlanned === 1 ? "" : "s"}
              </p>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard title="Builder Summary" description="Scope, counts, and plan status.">
            {summary ? (
              <p className="text-xs font-medium text-slate-600">
                Plan: {summary.subscription.name}
              </p>
            ) : null}
            <div className="space-y-2">
              <SummaryRow label="Planned" value={String(totalPlanned)} />
              <SummaryRow label="Types" value={String(activeMixTypes)} />
              <SummaryRow label="Active" value={String(activeSessionsCount)} />
            </div>
          </SectionCard>

          <SectionCard title="Recent Sessions">
            {sessionsQuery.data && !sessionsQuery.data.ok ? (
              <Notice tone="error" className="px-4 py-3">
                {sessionsQuery.data.message}
              </Notice>
            ) : null}

            <div className="space-y-3">
              {sessionsQuery.isLoading || metaQuery.isLoading ? (
                <EmptyState title="Loading sessions..." icon={LoaderCircle} className="py-6" />
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <Link
                    key={session.id}
                    to="/practice/$sessionId"
                    params={{ sessionId: session.id }}
                    className="hover-lift block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {session.title || "Practice Session"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {session.totalQuestions} questions
                          {session.completedAt
                            ? ` • Score ${session.correctAnswers}/${session.totalQuestions}`
                            : " • In progress"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                        {session.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No sessions yet"
                  description="Start a session to build your practice history."
                  icon={ClipboardList}
                  className="py-6"
                />
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
