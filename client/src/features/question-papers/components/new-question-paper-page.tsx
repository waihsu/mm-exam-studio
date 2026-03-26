import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, FileText, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";
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
  { type: "true_false", label: "True/False", helperText: "Good for quick checks." },
  { type: "fill_blank", label: "Fill Blank", helperText: "Good for short recall items." },
  { type: "short_answer", label: "Short Answer", helperText: "Use this for brief written responses." },
  { type: "matching", label: "Matching", helperText: "Useful for grouped concept checks." },
  { type: "long_answer", label: "Long Answer", helperText: "Use this when the paper needs full written-response questions." },
] as const;

type PaperMixType = (typeof PAPER_MIX_TYPES)[number]["type"];

const EMPTY_MIX = PAPER_MIX_TYPES.reduce<Record<PaperMixType, string>>((next, item) => {
  next[item.type] = "0";
  return next;
}, {} as Record<PaperMixType, string>);

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
  const [mixCounts, setMixCounts] = useState<Record<PaperMixType, string>>(EMPTY_MIX);
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
      const questionMix = PAPER_MIX_TYPES.map((item) => ({
        questionType: item.type,
        count: Number.parseInt(mixCounts[item.type] || "0", 10) || 0,
      })).filter((entry) => entry.count > 0);

      return workspaceApi.createQuestionPaper({
        title,
        schoolName,
        academicYear,
        instructions,
        brandAssetId: brandAssetId || undefined,
        includeAnswerKey,
        ...filters,
        count: questionMix.length > 0 ? undefined : Math.max(1, Number.parseInt(countValue || "10", 10) || 10),
        questionMix: questionMix.length > 0 ? questionMix : undefined,
      });
    },
    onSuccess: async (response) => {
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
  const brandAssets = brandingQuery.data?.ok ? brandingQuery.data.data.rows : [];
  const papers = papersQuery.data?.ok ? papersQuery.data.data.rows : [];
  const planCode = summary?.subscription.code;
  const questionLimit = summary?.subscription.limits.maxQuestionsPerPaper ?? null;

  useEffect(() => {
    if (hasBrandingSeeded) return;
    setHasBrandingSeeded(true);
    if (brandAssets.length === 0) return;
    const primaryAsset = brandAssets.find((asset) => asset.isPrimary);
    if (primaryAsset) {
      setBrandAssetId(primaryAsset.id);
    }
  }, [brandAssets, hasBrandingSeeded]);

  const configuredMixCount = useMemo(
    () =>
      PAPER_MIX_TYPES.reduce(
        (sum, item) => sum + (Number.parseInt(mixCounts[item.type] || "0", 10) || 0),
        0,
      ),
    [mixCounts],
  );

  const activeMixTypes = useMemo(
    () =>
      PAPER_MIX_TYPES.filter((item) => (Number.parseInt(mixCounts[item.type] || "0", 10) || 0) > 0)
        .length,
    [mixCounts],
  );

  const exceedsAvailableMix = useMemo(() => {
    if (!counts) return false;
    return PAPER_MIX_TYPES.some((item) => {
      const requested = Number.parseInt(mixCounts[item.type] || "0", 10) || 0;
      return requested > (counts[item.type] ?? 0);
    });
  }, [counts, mixCounts]);

  const fallbackCount = Math.max(1, Number.parseInt(countValue || "10", 10) || 10);
  const totalPlanned = configuredMixCount > 0 ? configuredMixCount : fallbackCount;
  const exceedsLimit = typeof questionLimit === "number" ? totalPlanned > questionLimit : false;
  const canCreate =
    !!title.trim() &&
    totalPlanned > 0 &&
    totalPlanned <= 50 &&
    !exceedsLimit &&
    !exceedsAvailableMix &&
    !createPaperMutation.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Question Papers"
        title="Paper Builder"
        description="Use the same scope plus mini blueprint flow as mobile, then create a draft paper."
        actions={
          <div className="grid min-w-[220px] gap-3 sm:grid-cols-3">
            <MiniStat label="Planned" value={String(totalPlanned)} />
            <MiniStat label="Types" value={String(activeMixTypes)} />
            <MiniStat label="Saved" value={String(papers.length)} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SectionCard
            title="Setup"
            description="Title, paper details, and answer key preference."
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
                  onChange={(event) => setTitle(event.target.value)}
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
                  onChange={(event) => setSchoolName(event.target.value)}
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
                  onChange={(event) => setAcademicYear(event.target.value)}
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
                    onChange={(event) => setIncludeAnswerKey(event.target.checked)}
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
              <BrandAssetPicker assets={brandAssets} value={brandAssetId} onChange={setBrandAssetId} />
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Instructions
              </span>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Paper instructions"
                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
          </SectionCard>

          <QuestionScopePanel
            meta={meta}
            planCode={planCode}
            value={filters}
            onChange={setFilters}
            title="Paper Scope"
            hint="Choose the syllabus scope once, then set the exact paper mix below."
          />

          <QuestionMixPanel
            title="Mini Blueprint"
            hint="Set exact counts by question type. Leave every row at 0 to use the fallback paper count below."
            items={PAPER_MIX_TYPES.map((item) => ({ ...item }))}
            values={mixCounts}
            onChange={(type, value) =>
              setMixCounts((current) => ({
                ...current,
                [type]: value,
              }))
            }
            totalPlanned={configuredMixCount}
            availableCounts={counts}
            unavailableMessage={
              exceedsAvailableMix
                ? "One or more requested question types exceed the available questions in this scope."
                : null
            }
          />

          <SectionCard
            title="Generate Draft"
            description="Use the fallback count only when every mini blueprint row stays at 0."
            actions={
              <button
                type="button"
                onClick={() => setMixCounts(EMPTY_MIX)}
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
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900 sm:max-w-[180px]"
                />
              </label>
            ) : (
              <Notice tone="info">
                The exact mix above will be used for this paper draft.
              </Notice>
            )}

            {countsQuery.data && !countsQuery.data.ok ? (
              <Notice tone="error">
                {countsQuery.data.message}
              </Notice>
            ) : null}
            {createPaperMutation.data && !createPaperMutation.data.ok ? (
              <Notice tone="error">
                {createPaperMutation.data.message}
              </Notice>
            ) : null}
            {planCode === "free" ? (
              <Notice tone="warning">
                Free plan can generate papers from free preview chapters and lessons only, up to {questionLimit ?? 0} questions in one paper.
              </Notice>
            ) : null}
            {exceedsLimit ? (
              <Notice tone="error">
                Reduce this draft to {questionLimit} questions or fewer for your current plan.
              </Notice>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={!canCreate}
                onClick={() => {
                  void createPaperMutation.mutateAsync();
                }}
              >
                {createPaperMutation.isPending ? "Creating..." : "Create draft"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-slate-500">
                Planned paper: {totalPlanned} question{totalPlanned === 1 ? "" : "s"}
              </p>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard title="Builder Summary" description="Draft plan and current limits.">
            {summary ? (
              <p className="text-xs font-medium text-slate-600">
                Plan: {summary.subscription.name}
              </p>
            ) : null}
            <div className="space-y-2">
              <SummaryRow label="Planned" value={String(totalPlanned)} />
              <SummaryRow label="Types" value={String(activeMixTypes)} />
              <SummaryRow label="Saved" value={String(papers.length)} />
            </div>
          </SectionCard>

          <SectionCard title="Recent Papers">
            <div className="space-y-3">
              {papersQuery.isLoading ? (
                <EmptyState title="Loading papers..." icon={LoaderCircle} className="py-6" />
              ) : papers.length > 0 ? (
                papers.slice(0, 5).map((paper) => (
                  <Link
                    key={paper.id}
                    to="/question-papers/$paperId"
                    params={{ paperId: paper.id }}
                    className="hover-lift block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-900"
                  >
                    <p className="font-semibold text-slate-900">{paper.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {paper.totalQuestions} questions • {paper.totalMarks} marks
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
