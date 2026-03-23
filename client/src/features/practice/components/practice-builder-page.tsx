import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { QuestionCatalogSelector } from "@/features/workspace/components/question-catalog-selector";
import { QuestionFilterPanel } from "@/features/workspace/components/question-filter-panel";
import { usePracticeBuilderPageData } from "../hooks/use-practice-builder-page-data";
import { QuickStat, SummaryRow } from "./practice-shared";

export function PracticeBuilderPage() {
  const {
    filters,
    generatorMode,
    page,
    catalogQuery,
    sessionsQuery,
    createSessionMutation,
    meta,
    catalog,
    lockedRows,
    lockedTotal,
    sessions,
    summary,
    planCode,
    questionLimit,
    selectedQuestionIds,
    selectedCount,
    activeSessionsCount,
    exceedsLimit,
    selectionLabel,
    setPage,
    updateMode,
    updateFilters,
    toggleQuestion,
    clearSelection,
    startPractice,
  } = usePracticeBuilderPageData();

  return (
    <div className="space-y-4">
      <section className="app-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Practice
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Build a session
            </h2>
            <p className="mt-1 text-sm text-slate-600">Choose questions and launch practice fast.</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[260px] sm:gap-3">
            <QuickStat label="Selected" value={String(selectedCount)} />
            <QuickStat label="Catalog" value={String(catalog?.total ?? 0)} />
            <QuickStat label="Active" value={String(activeSessionsCount)} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 reveal-up reveal-delay-1">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Generator mode</p>
                <p className="mt-1 text-sm text-slate-500">Choose session mode.</p>
              </div>
              <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => updateMode("all_questions")}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                    generatorMode === "all_questions"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600"
                  }`}
                >
                  All Questions
                </button>
                <button
                  type="button"
                  onClick={() => updateMode("mcq_only")}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                    generatorMode === "mcq_only" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  MCQ Only
                </button>
              </div>
            </div>
            <QuestionFilterPanel
              meta={meta}
              planCode={planCode}
              value={filters}
              onChange={(next) => {
                updateFilters(next);
              }}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 pb-20 sm:pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectionLabel}</p>
                <p className="mt-1 text-sm text-slate-500">Pick questions and start.</p>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Mode: {generatorMode === "mcq_only" ? "MCQ Only" : "All Questions"}
                </p>
                {planCode === "free" ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Free plan is limited to free preview chapters and lessons, with up to{" "}
                    {questionLimit ?? 0} questions per practice session.
                  </p>
                ) : null}
                {exceedsLimit ? (
                  <p className="mt-2 text-xs font-medium text-red-700">
                    Reduce the selection to {questionLimit} questions or fewer to start practice.
                  </p>
                ) : null}
                {lockedTotal > 0 ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {lockedTotal} question{lockedTotal > 1 ? "s are" : " is"} locked for your{" "}
                    {summary?.subscription.name ?? "current"} plan.
                  </p>
                ) : null}
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {selectedCount > 0 ? (
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={clearSelection}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
                <Button
                  className="hidden lg:hidden sm:inline-flex"
                  disabled={selectedCount === 0 || exceedsLimit || createSessionMutation.isPending}
                  onClick={() => {
                    void startPractice();
                  }}
                >
                  {createSessionMutation.isPending ? "Starting..." : "Start practice"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {catalogQuery.data && !catalogQuery.data.ok ? (
              <Notice tone="error" className="mt-4 px-4 py-3">
                {catalogQuery.data.message}
              </Notice>
            ) : null}
            {createSessionMutation.data && !createSessionMutation.data.ok ? (
              <Notice tone="error" className="mt-4 px-4 py-3">
                {createSessionMutation.data.message}
              </Notice>
            ) : null}

            <div className="mt-4">
              {catalogQuery.isLoading ? (
                <EmptyState
                  title="Loading questions..."
                  description="Preparing catalog based on your filters."
                  icon={LoaderCircle}
                />
              ) : (
                <QuestionCatalogSelector
                  rows={catalog?.rows ?? []}
                  lockedRows={lockedRows}
                  lockedTotal={lockedTotal}
                  selectedIds={selectedQuestionIds}
                  onToggle={toggleQuestion}
                />
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {catalog?.page ?? 1} of {catalog?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-white sm:flex-none"
                  disabled={(catalog?.page ?? 1) <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-white sm:flex-none"
                  disabled={(catalog?.page ?? 1) >= (catalog?.totalPages ?? 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="hidden rounded-xl border border-slate-200 bg-white p-4 lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Session
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">Session summary</h3>
            <p className="mt-1 text-sm text-slate-500">Selection and status.</p>
            {summary ? (
              <p className="mt-2 text-xs font-medium text-slate-600">
                Plan: {summary.subscription.name}
              </p>
            ) : null}
            <div className="mt-4 space-y-2">
              <SummaryRow label="Selected" value={String(selectedCount)} />
              <SummaryRow label="Catalog" value={String(catalog?.total ?? 0)} />
              <SummaryRow label="Active" value={String(activeSessionsCount)} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                disabled={selectedCount === 0 || exceedsLimit || createSessionMutation.isPending}
                onClick={() => {
                  void startPractice();
                }}
              >
                {createSessionMutation.isPending ? "Starting..." : "Start practice"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {selectedCount > 0 ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={clearSelection}
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear selection
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Recent sessions</h3>
            </div>

            {sessionsQuery.data && !sessionsQuery.data.ok ? (
              <Notice tone="error" className="mt-4 px-4 py-3">
                {sessionsQuery.data.message}
              </Notice>
            ) : null}

            <div className="mt-4 space-y-3">
              {sessionsQuery.isLoading ? (
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
          </section>
        </aside>
      </div>

      <div className="sticky bottom-2 z-20 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:hidden">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Selection
              </p>
              <p className="text-sm font-semibold text-slate-900">{selectionLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              ) : null}
              <Button
                disabled={selectedCount === 0 || exceedsLimit || createSessionMutation.isPending}
                onClick={() => {
                  void startPractice();
                }}
              >
                {createSessionMutation.isPending ? "Starting..." : "Start"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
