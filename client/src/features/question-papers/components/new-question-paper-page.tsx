import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  LoaderCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SectionCard } from "@/components/ui/page-shell";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import { BrandAssetPicker } from "@/features/workspace/components/brand-asset-picker";
import { QuestionMixPanel } from "@/features/workspace/components/question-mix-panel";
import { QuestionScopePanel } from "@/features/workspace/components/question-scope-panel";
import type { WorkspaceFilters } from "@/features/workspace/types";

const DEFAULT_FILTERS: WorkspaceFilters = {
  search: "",
  gradeId: "",
  subjectId: "",
  chapterId: "",
  subChapterId: "",
};

const PAPER_MIX_TYPES = [
  { type: "mcq", label: "MCQ", helperText: "Set 0 to leave this type out." },
  {
    type: "true_false",
    label: "True/False",
    helperText: "Good for quick checks.",
  },
  {
    type: "fill_blank",
    label: "Fill Blank",
    helperText: "Good for short recall items.",
  },
  {
    type: "short_answer",
    label: "Short Answer",
    helperText: "Use this for brief written responses.",
  },
  {
    type: "matching",
    label: "Matching",
    helperText: "Useful for grouped concept checks.",
  },
  {
    type: "long_answer",
    label: "Long Answer",
    helperText:
      "Use this when the paper needs full written-response questions.",
  },
] as const;

const QUICK_COUNTS = [10, 20, 30, 40] as const;

type PaperMixType = (typeof PAPER_MIX_TYPES)[number]["type"];

const EMPTY_MIX = PAPER_MIX_TYPES.reduce<Record<PaperMixType, string>>(
  (next, item) => {
    next[item.type] = "0";
    return next;
  },
  {} as Record<PaperMixType, string>
);

export function NewQuestionPaperPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [schoolName, setSchoolName] = useState("MM Exam Studio");
  const [academicYear, setAcademicYear] = useState("");
  const [instructions, setInstructions] = useState("");
  const [brandAssetId, setBrandAssetId] = useState("");
  const [hasBrandingSeeded, setHasBrandingSeeded] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [filters, setFilters] = useState<WorkspaceFilters>(DEFAULT_FILTERS);
  const [mixCounts, setMixCounts] =
    useState<Record<PaperMixType, string>>(EMPTY_MIX);
  const [countValue, setCountValue] = useState("10");

  const metaQuery = useQuery({
    queryKey: ["workspace-meta"],
    queryFn: () => workspaceApi.getMeta(),
  });
  const countsQuery = useQuery({
    queryKey: ["workspace-catalog-counts-paper-builder", filters],
    queryFn: () => workspaceApi.getCatalogCounts(filters),
  });
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary"],
    queryFn: () => workspaceApi.getSummary(),
  });
  const brandingQuery = useQuery({
    queryKey: ["workspace-branding"],
    queryFn: () => workspaceApi.listBrandAssets(),
  });
  const papersQuery = useQuery({
    queryKey: ["workspace-papers"],
    queryFn: () => workspaceApi.listQuestionPapers(),
  });

  const createPaperMutation = useMutation({
    mutationFn: () => {
      const questionMix = PAPER_MIX_TYPES.map(item => ({
        questionType: item.type,
        count: Number.parseInt(mixCounts[item.type] || "0", 10) || 0,
      })).filter(entry => entry.count > 0);

      return workspaceApi.createQuestionPaper({
        title,
        schoolName,
        academicYear,
        instructions,
        brandAssetId: brandAssetId || undefined,
        includeAnswerKey,
        ...filters,
        count:
          questionMix.length > 0
            ? undefined
            : Math.max(1, Number.parseInt(countValue || "10", 10) || 10),
        questionMix: questionMix.length > 0 ? questionMix : undefined,
      });
    },
    onSuccess: async response => {
      if (!response.ok) return;
      await navigate({
        to: "/question-papers/$paperId",
        params: { paperId: response.data.id },
      });
    },
  });

  const meta = metaQuery.data?.ok ? metaQuery.data.data : undefined;
  const counts = countsQuery.data?.ok ? countsQuery.data.data : undefined;
  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : undefined;
  const brandAssets = useMemo(
    () => (brandingQuery.data?.ok ? brandingQuery.data.data.rows : []),
    [brandingQuery.data]
  );
  const papers = papersQuery.data?.ok ? papersQuery.data.data.rows : [];
  const planCode = summary?.subscription.code;
  const questionLimit =
    summary?.subscription.limits.maxQuestionsPerPaper ?? null;

  useEffect(() => {
    if (hasBrandingSeeded) return;
    setHasBrandingSeeded(true);
    if (brandAssets.length === 0) return;
    const primaryAsset = brandAssets.find(asset => asset.isPrimary);
    if (primaryAsset) {
      setBrandAssetId(primaryAsset.id);
    }
  }, [brandAssets, hasBrandingSeeded]);

  const configuredMixCount = useMemo(
    () =>
      PAPER_MIX_TYPES.reduce(
        (sum, item) =>
          sum + (Number.parseInt(mixCounts[item.type] || "0", 10) || 0),
        0
      ),
    [mixCounts]
  );

  const activeMixTypes = useMemo(
    () =>
      PAPER_MIX_TYPES.filter(
        item => (Number.parseInt(mixCounts[item.type] || "0", 10) || 0) > 0
      ).length,
    [mixCounts]
  );

  const exceedsAvailableMix = useMemo(() => {
    if (!counts) return false;
    return PAPER_MIX_TYPES.some(item => {
      const requested = Number.parseInt(mixCounts[item.type] || "0", 10) || 0;
      return requested > (counts[item.type] ?? 0);
    });
  }, [counts, mixCounts]);

  const fallbackCount = Math.max(
    1,
    Number.parseInt(countValue || "10", 10) || 10
  );
  const totalPlanned =
    configuredMixCount > 0 ? configuredMixCount : fallbackCount;
  const hasExactMix = configuredMixCount > 0;
  const exceedsAvailableQuestions = counts ? counts.all < totalPlanned : false;
  const exceedsLimit =
    typeof questionLimit === "number" ? totalPlanned > questionLimit : false;
  const canCreate =
    !!title.trim() &&
    !!filters.gradeId &&
    !!filters.subjectId &&
    Boolean(counts) &&
    totalPlanned > 0 &&
    totalPlanned <= 50 &&
    !exceedsLimit &&
    !exceedsAvailableQuestions &&
    !exceedsAvailableMix &&
    !createPaperMutation.isPending;

  return (
    <div className="space-y-7 pb-4">
      <section className="grid gap-5 border-b border-slate-200 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="ui-kicker text-indigo-700">Paper studio</p>
          <h1 className="mt-3 text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.045em] text-slate-950">
            Compose a paper that feels intentional.
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-7 text-slate-600">
            Name the paper, choose the right syllabus, then decide how much it
            should assess.
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[300px] sm:gap-3">
          <MiniStat label="Planned" value={String(totalPlanned)} />
          <MiniStat label="Types" value={String(activeMixTypes)} />
          <MiniStat label="Saved" value={String(papers.length)} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SectionCard
            title="01 · Paper identity"
            description="Name the paper, set the school details, and choose what the final document should include."
            actions={
              <Button asChild variant="outline" className="bg-white">
                <Link to="/question-papers">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Title
                </span>
                <input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Paper title"
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  School
                </span>
                <input
                  value={schoolName}
                  onChange={event => setSchoolName(event.target.value)}
                  placeholder="School name"
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Academic year
                </span>
                <input
                  value={academicYear}
                  onChange={event => setAcademicYear(event.target.value)}
                  placeholder="2025-2026"
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Output
                </span>
                <span className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeAnswerKey}
                    onChange={event =>
                      setIncludeAnswerKey(event.target.checked)
                    }
                  />
                  Include answer key
                </span>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Branding
                </span>
                <Link
                  to="/settings"
                  className="text-xs font-semibold text-slate-700 underline-offset-4 hover:underline"
                >
                  Manage logos
                </Link>
              </div>
              <BrandAssetPicker
                assets={brandAssets}
                value={brandAssetId}
                onChange={setBrandAssetId}
              />
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Instructions
              </span>
              <textarea
                value={instructions}
                onChange={event => setInstructions(event.target.value)}
                placeholder="Paper instructions"
                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
          </SectionCard>

          <SectionCard
            title="02 · Choose the syllabus"
            description="Every paper starts with a grade and subject. Narrow it to a chapter or lesson only when that is the goal."
          >
            <QuestionScopePanel
              meta={meta}
              planCode={planCode}
              value={filters}
              onChange={setFilters}
              title="What should this paper cover?"
              hint="Grade and subject are required so every question belongs to the intended curriculum."
              requiredFields={["grade", "subject"]}
              surface="plain"
            />
          </SectionCard>

          <section className="relative isolate overflow-hidden rounded-[24px] bg-[#121b33] p-5 text-white shadow-[0_22px_50px_-36px_rgba(15,23,42,0.82)] sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_5%,rgba(111,99,255,0.42),transparent_32%),radial-gradient(circle_at_15%_105%,rgba(15,166,184,0.2),transparent_42%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ui-kicker text-indigo-200">03 · Set the pace</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">
                    How much should this paper ask of a learner?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Set the paper length after choosing its syllabus. Use the
                    optional controls only when you need an exact type mix.
                  </p>
                </div>
                {hasExactMix ? (
                  <button
                    type="button"
                    onClick={() => setMixCounts(EMPTY_MIX)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
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
                      setMixCounts(EMPTY_MIX);
                      setCountValue(String(count));
                    }}
                    className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-bold transition ${!hasExactMix && fallbackCount === count ? "border-white bg-white text-slate-950" : "border-slate-700 bg-slate-900 text-white hover:border-slate-400"}`}
                  >
                    {count}
                  </button>
                ))}
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300">
                  Custom
                  <input
                    value={countValue}
                    onChange={event => {
                      setMixCounts(EMPTY_MIX);
                      setCountValue(
                        event.target.value.replace(/[^\d]/g, "").slice(0, 2)
                      );
                    }}
                    inputMode="numeric"
                    className="h-9 w-12 border-0 bg-transparent text-center font-bold text-white outline-none"
                    aria-label="Custom paper question count"
                  />
                </label>
              </div>
              {hasExactMix ? (
                <p className="mt-4 rounded-lg bg-slate-800 px-3 py-2 text-sm text-sky-100">
                  Your exact mix is active: {configuredMixCount} questions
                  across {activeMixTypes} types.
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  disabled={!canCreate}
                  onClick={() => void createPaperMutation.mutateAsync()}
                  className="bg-white text-slate-950 hover:bg-slate-100"
                >
                  {createPaperMutation.isPending
                    ? "Creating..."
                    : "Create draft"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm text-slate-300">
                  {totalPlanned} question{totalPlanned === 1 ? "" : "s"} in this
                  draft
                </p>
              </div>
              {!filters.gradeId || !filters.subjectId ? (
                <p className="mt-3 text-sm font-medium text-amber-200">
                  Choose a grade and subject above before creating this draft.
                </p>
              ) : null}
              {filters.gradeId &&
              filters.subjectId &&
              exceedsAvailableQuestions ? (
                <p className="mt-3 text-sm font-medium text-amber-200">
                  This scope has {counts?.all ?? 0} published questions. Reduce
                  the draft to that number or add more questions first.
                </p>
              ) : null}
            </div>
          </section>

          <details
            className="group rounded-2xl border border-slate-200 bg-white"
            open={hasExactMix}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-slate-900 marker:hidden">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Refine
                the source
              </span>
              <span className="text-sm font-medium text-slate-500 group-open:hidden">
                Exact question mix
              </span>
              <span className="hidden text-sm font-medium text-slate-500 group-open:inline">
                Close options
              </span>
            </summary>
            <div className="space-y-4 border-t border-slate-200 p-4 sm:p-5">
              <QuestionMixPanel
                title="Choose an exact question mix"
                hint="Optional. Set exact counts by type; otherwise the simple question count above will be used."
                items={PAPER_MIX_TYPES.map(item => ({ ...item }))}
                values={mixCounts}
                onChange={(type, value) =>
                  setMixCounts(current => ({ ...current, [type]: value }))
                }
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
          {createPaperMutation.data && !createPaperMutation.data.ok ? (
            <Notice tone="error">{createPaperMutation.data.message}</Notice>
          ) : null}
          {planCode === "free" ? (
            <Notice tone="warning">
              Free plan can generate papers from free preview chapters and
              lessons only, up to {questionLimit ?? 0} questions in one paper.
            </Notice>
          ) : null}
          {exceedsLimit ? (
            <Notice tone="error">
              Reduce this draft to {questionLimit} questions or fewer for your
              current plan.
            </Notice>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Draft receipt"
            description="A live check before the draft is created."
          >
            {summary ? (
              <p className="text-xs font-medium text-slate-600">
                Access: Open access
              </p>
            ) : null}
            <div className="space-y-2">
              <SummaryRow label="Planned" value={String(totalPlanned)} />
              <SummaryRow
                label="Available"
                value={
                  filters.gradeId && filters.subjectId
                    ? String(counts?.all ?? 0)
                    : "Choose scope"
                }
              />
              <SummaryRow
                label="Grade"
                value={
                  meta?.grades.find(grade => grade.id === filters.gradeId)
                    ?.name ?? "Choose grade"
                }
              />
              <SummaryRow
                label="Subject"
                value={
                  meta?.subjects.find(
                    subject => subject.id === filters.subjectId
                  )?.name ?? "Choose subject"
                }
              />
              <SummaryRow label="Types" value={String(activeMixTypes)} />
              <SummaryRow label="Saved" value={String(papers.length)} />
            </div>
          </SectionCard>

          <SectionCard title="Recent Papers">
            <div className="space-y-3">
              {papersQuery.isLoading ? (
                <EmptyState
                  title="Loading papers..."
                  icon={LoaderCircle}
                  className="py-6"
                />
              ) : papers.length > 0 ? (
                papers.slice(0, 5).map(paper => (
                  <Link
                    key={paper.id}
                    to="/question-papers/$paperId"
                    params={{ paperId: paper.id }}
                    className="hover-lift block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-900"
                  >
                    <p className="font-semibold text-slate-900">
                      {paper.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {paper.totalQuestions} questions • {paper.totalMarks}{" "}
                      marks
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No papers yet"
                  description="Create your first draft to start building exports."
                  icon={FileText}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
