import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  LoaderCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SectionCard } from "@/components/ui/page-shell";
import { QuestionMixPanel } from "@/features/workspace/components/question-mix-panel";
import { QuestionScopePanel } from "@/features/workspace/components/question-scope-panel";
import { usePracticeBuilderPageData } from "../hooks/use-practice-builder-page-data";
import { QuickStat, SummaryRow } from "./practice-shared";

const PRACTICE_MIX_ITEMS = [
  { type: "mcq", label: "MCQ", helperText: "Set 0 to leave this type out." },
  {
    type: "true_false",
    label: "True/False",
    helperText: "Use 0 if you do not need quick binary checks.",
  },
  {
    type: "fill_blank",
    label: "Fill Blank",
    helperText: "Good for short recall checks.",
  },
  {
    type: "short_answer",
    label: "Short Answer",
    helperText: "Use this for brief written responses.",
  },
  {
    type: "matching",
    label: "Matching",
    helperText: "Use 0 to skip matching in this session.",
  },
] as const;

const QUICK_COUNTS = [5, 10, 15, 20] as const;

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
    scopeReady,
    exceedsLimit,
    exceedsAvailableQuestions,
    exceedsAvailableMix,
    countValue,
    updateFilters,
    setMixCount,
    clearMix,
    setCountValue,
    startPractice,
  } = usePracticeBuilderPageData();

  const fallbackCount = Math.max(
    1,
    Number.parseInt(countValue || "10", 10) || 10
  );
  const totalPlanned =
    configuredMixCount > 0 ? configuredMixCount : fallbackCount;
  const hasExactMix = configuredMixCount > 0;
  const canStart =
    totalPlanned > 0 &&
    scopeReady &&
    totalPlanned <= 50 &&
    !exceedsLimit &&
    !exceedsAvailableQuestions &&
    !exceedsAvailableMix &&
    Boolean(counts) &&
    !createSessionMutation.isPending;

  return (
    <div className="space-y-7 pb-4">
      <section className="grid gap-5 border-b border-[#d8d4c9] pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="ui-kicker text-[#48766b]">Practice planner</p>
          <h1 className="mt-3 text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.045em] text-[#202321]">
            Build one session with a purpose.
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-7 text-[#6e706b]">
            Set the class and subject first. Everything else is optional
            control, not another obstacle.
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[300px] sm:gap-3">
          <QuickStat label="Questions" value={String(totalPlanned)} />
          <QuickStat label="Types" value={String(activeMixTypes)} />
          <QuickStat label="Active" value={String(activeSessionsCount)} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#d8d4c9] bg-[#fffdf8] p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.36)] sm:p-7">
            <div className="mb-5 flex flex-wrap items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#202321] text-sm font-extrabold text-white shadow-lg shadow-slate-900/10">
                01
              </span>
              <div>
                <p className="ui-kicker text-[#d76f55]">Define the focus</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#202321]">
                  Which class and subject need your attention?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6e706b]">
                  Grade and subject are required. Chapter and lesson are
                  optional when you want a narrower focus.
                </p>
              </div>
            </div>
            <QuestionScopePanel
              meta={meta}
              planCode={planCode}
              value={filters}
              onChange={updateFilters}
              requiredFields={["grade", "subject"]}
              title="Practice scope"
              hint="Select the class and subject for this session."
              surface="plain"
            />
          </section>

          <section className="relative isolate overflow-hidden rounded-[24px] bg-[#202321] p-5 text-white shadow-[0_22px_50px_-36px_rgba(15,23,42,0.82)] sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_5%,rgba(215,111,85,0.34),transparent_32%),radial-gradient(circle_at_15%_105%,rgba(127,169,157,0.22),transparent_42%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ui-kicker text-[#c8f27a]">02 · Set the pace</p>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                    How much focus do you have today?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#d8d4c9]">
                    Choose a short set and begin. The question bank fills the
                    mix unless you decide otherwise.
                  </p>
                </div>
                {hasExactMix ? (
                  <button
                    type="button"
                    onClick={clearMix}
                    className="rounded-lg border border-[#48534d] px-3 py-2 text-sm font-semibold text-[#d8d4c9] transition hover:bg-[#333c36]"
                  >
                    Use simple count
                  </button>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {QUICK_COUNTS.map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      clearMix();
                      setCountValue(String(count));
                    }}
                    className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-bold transition ${
                      !hasExactMix && fallbackCount === count
                        ? "border-white bg-white text-[#202321]"
                        : "border-[#48534d] bg-[#2c322d] text-white hover:border-[#7fa99d]"
                    }`}
                  >
                    {count}
                  </button>
                ))}
                <label className="flex items-center gap-2 rounded-lg border border-[#48534d] bg-[#2c322d] px-3 text-sm text-[#d8d4c9]">
                  Custom
                  <input
                    value={countValue}
                    onChange={event => {
                      clearMix();
                      setCountValue(
                        event.target.value.replace(/[^\d]/g, "").slice(0, 2)
                      );
                    }}
                    inputMode="numeric"
                    className="h-9 w-12 border-0 bg-transparent text-center font-bold text-white outline-none"
                    aria-label="Custom question count"
                  />
                </label>
              </div>

              {hasExactMix ? (
                <p className="mt-4 rounded-lg bg-[#333c36] px-3 py-2 text-sm text-[#e7efe9]">
                  Your exact mix is active: {configuredMixCount} questions
                  across {activeMixTypes} types.
                </p>
              ) : null}

              {!scopeReady ? (
                <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                  Select your grade and subject above to unlock practice.
                </p>
              ) : null}
              {scopeReady && exceedsAvailableQuestions ? (
                <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                  This scope has {counts?.all ?? 0} published questions. Reduce
                  the session length or add more questions first.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  disabled={!canStart}
                  onClick={() => void startPractice()}
                  className="bg-white text-[#202321] hover:bg-[#e7efe9]"
                >
                  {createSessionMutation.isPending
                    ? "Starting..."
                    : "Start practice"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#d8d4c9]">
                  {totalPlanned} question{totalPlanned === 1 ? "" : "s"} in this
                  focus block
                </span>
              </div>
            </div>
          </section>

          <details
            className="group rounded-2xl border border-[#d8d4c9] bg-[#fffdf8]"
            open={hasExactMix}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-[#202321] marker:hidden">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#6e706b]" />
                Choose an exact question mix
              </span>
              <span className="text-sm font-medium text-[#6e706b] group-open:hidden">
                Optional
              </span>
              <span className="hidden text-sm font-medium text-[#6e706b] group-open:inline">
                Close options
              </span>
            </summary>
            <div className="space-y-4 border-t border-slate-200 p-4 sm:p-5">
              <QuestionMixPanel
                title="Choose an exact question mix"
                hint="Optional. Set the rows you want; otherwise your simple question count above will be used."
                items={PRACTICE_MIX_ITEMS.map(item => ({ ...item }))}
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
            </div>
          </details>

          {countsQuery.data && !countsQuery.data.ok ? (
            <Notice tone="error">{countsQuery.data.message}</Notice>
          ) : null}
          {createSessionMutation.data && !createSessionMutation.data.ok ? (
            <Notice tone="error">{createSessionMutation.data.message}</Notice>
          ) : null}
          {planCode === "free" ? (
            <Notice tone="warning">
              Free plan can use free preview chapters and lessons only, up to{" "}
              {questionLimit ?? 0} questions per practice session.
            </Notice>
          ) : null}
          {exceedsLimit ? (
            <Notice tone="error">
              Reduce this session to {questionLimit} questions or fewer for your
              current plan.
            </Notice>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Session receipt"
            description="A live check before you begin."
          >
            {summary ? (
              <p className="text-xs font-medium text-[#6e706b]">
                Access: Open access
              </p>
            ) : null}
            <div className="space-y-2">
              <SummaryRow label="Questions" value={String(totalPlanned)} />
              <SummaryRow
                label="Available"
                value={scopeReady ? String(counts?.all ?? 0) : "Choose scope"}
              />
              <SummaryRow
                label="Scope"
                value={
                  scopeReady ? "Ready to launch" : "Select grade + subject"
                }
              />
              <SummaryRow
                label="Question types"
                value={hasExactMix ? String(activeMixTypes) : "Auto mix"}
              />
              <SummaryRow
                label="Active sessions"
                value={String(activeSessionsCount)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Return to a session">
            {sessionsQuery.data && !sessionsQuery.data.ok ? (
              <Notice tone="error" className="px-4 py-3">
                {sessionsQuery.data.message}
              </Notice>
            ) : null}
            <div className="space-y-3">
              {sessionsQuery.isLoading || metaQuery.isLoading ? (
                <EmptyState
                  title="Loading sessions..."
                  icon={LoaderCircle}
                  className="py-6"
                />
              ) : sessions.length > 0 ? (
                sessions.map(session => (
                  <Link
                    key={session.id}
                    to="/practice/$sessionId"
                    params={{ sessionId: session.id }}
                    className="hover-lift block rounded-lg border border-slate-200 bg-[#f8f5ee] px-3 py-3 transition hover:border-[#48766b]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#202321]">
                          {session.title || "Practice Session"}
                        </p>
                        <p className="mt-1 text-sm text-[#6e706b]">
                          {session.totalQuestions} questions
                          {session.completedAt
                            ? ` • Score ${session.correctAnswers}/${session.totalQuestions}`
                            : " • In progress"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#2c322d] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                        {session.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No sessions yet"
                  description="Start a short session to build your practice history."
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
