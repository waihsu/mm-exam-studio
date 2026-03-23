import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import { BrandAssetPicker } from "@/features/workspace/components/brand-asset-picker";
import { QuestionCatalogSelector } from "@/features/workspace/components/question-catalog-selector";
import { QuestionFilterPanel } from "@/features/workspace/components/question-filter-panel";
import type { WorkspaceFilters } from "@/features/workspace/types";

const DEFAULT_FILTERS: WorkspaceFilters = {
  search: "",
  gradeId: "",
  subjectId: "",
  chapterId: "",
  subChapterId: "",
};

export function NewQuestionPaperPage() {
  const navigate = useNavigate();
  const [generatorMode, setGeneratorMode] = useState<"all_questions" | "mcq_only">(
    "all_questions",
  );
  const [title, setTitle] = useState("");
  const [schoolName, setSchoolName] = useState("MM Exam Studio");
  const [academicYear, setAcademicYear] = useState("");
  const [instructions, setInstructions] = useState("");
  const [brandAssetId, setBrandAssetId] = useState("");
  const [hasBrandingSeeded, setHasBrandingSeeded] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [filters, setFilters] = useState<WorkspaceFilters>(DEFAULT_FILTERS);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const metaQuery = useQuery({
    queryKey: ["workspace-meta"],
    queryFn: () => workspaceApi.getMeta(),
  });

  const catalogQuery = useQuery({
    queryKey: ["workspace-catalog-paper-builder", filters, generatorMode, page],
    queryFn: () =>
      workspaceApi.getCatalog({
        ...filters,
        questionType: generatorMode === "mcq_only" ? "mcq" : undefined,
        page,
        pageSize: 20,
      }),
  });
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary"],
    queryFn: () => workspaceApi.getSummary(),
  });
  const brandingQuery = useQuery({
    queryKey: ["workspace-branding"],
    queryFn: () => workspaceApi.listBrandAssets(),
  });

  const createPaperMutation = useMutation({
    mutationFn: () =>
      workspaceApi.createQuestionPaper({
        title,
        schoolName,
        academicYear,
        instructions,
        brandAssetId: brandAssetId || undefined,
        includeAnswerKey,
        generatorMode,
        ...filters,
        questionIds: selectedQuestionIds,
      }),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await navigate({
        to: "/question-papers/$paperId",
        params: { paperId: response.data.id },
      });
    },
  });

  const meta = metaQuery.data?.ok ? metaQuery.data.data : undefined;
  const catalog = catalogQuery.data?.ok ? catalogQuery.data.data : undefined;
  const lockedRows = catalog?.lockedRows ?? [];
  const lockedTotal = catalog?.lockedTotal ?? 0;
  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : undefined;
  const brandAssets = brandingQuery.data?.ok ? brandingQuery.data.data.rows : [];
  const planCode = summary?.subscription.code;
  const questionLimit = summary?.subscription.limits.maxQuestionsPerPaper ?? null;
  const exceedsLimit =
    typeof questionLimit === "number" ? selectedQuestionIds.length > questionLimit : false;
  const canCreate =
    !!title.trim() &&
    selectedQuestionIds.length > 0 &&
    !exceedsLimit &&
    !createPaperMutation.isPending;

  useEffect(() => {
    if (hasBrandingSeeded) return;
    setHasBrandingSeeded(true);
    if (brandAssets.length === 0) return;
    const primaryAsset = brandAssets.find((asset) => asset.isPrimary);
    if (primaryAsset) {
      setBrandAssetId(primaryAsset.id);
    }
  }, [brandAssets, hasBrandingSeeded]);

  return (
    <div className="space-y-4">
      <section className="app-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Question Papers
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              New paper
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Build, review, and export a polished paper.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
            <MiniStat label="Selected" value={String(selectedQuestionIds.length)} />
            <MiniStat label="Catalog" value={String(catalog?.total ?? 0)} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Paper setup</p>
              <Button asChild variant="outline" className="bg-white">
                <Link to="/question-papers">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 lg:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Generator mode
                </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSelectedQuestionIds([]);
                      setGeneratorMode("all_questions");
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      generatorMode === "all_questions"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    All Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSelectedQuestionIds([]);
                      setGeneratorMode("mcq_only");
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      generatorMode === "mcq_only" ? "bg-slate-900 text-white" : "text-slate-600"
                    }`}
                  >
                    MCQ Only
                  </button>
                </div>
              </label>
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
                  placeholder="Academic year"
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
              {summary ? (
                <p className="text-xs text-slate-500">
                  {summary.brandingCount}/{summary.subscription.limits.brandingLogoLimit} saved
                  logos on the {summary.subscription.name} plan.
                </p>
              ) : null}
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

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              Draft workflow:{" "}
              <span className="font-semibold text-slate-900">
                create draft {"->"} manage questions {"->"} finalize {"->"} download PDF
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <QuestionFilterPanel
              meta={meta}
              planCode={planCode}
              value={filters}
              onChange={(next) => {
                setPage(1);
                setSelectedQuestionIds([]);
                setFilters(next);
              }}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedQuestionIds.length} selected
                </p>
                <p className="mt-1 text-sm text-slate-500">Build paper from selected questions.</p>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Mode: {generatorMode === "mcq_only" ? "MCQ Only" : "All Questions"}
                </p>
                {planCode === "free" ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Free plan can generate papers from free preview chapters and lessons only, up
                    to {questionLimit ?? 0} questions in one paper.
                  </p>
                ) : null}
                {exceedsLimit ? (
                  <p className="mt-2 text-xs font-medium text-red-700">
                    Reduce the selection to {questionLimit} questions or fewer to create this
                    paper.
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
                {selectedQuestionIds.length > 0 ? (
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={() => setSelectedQuestionIds([])}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
                <Button
                  disabled={!canCreate}
                  onClick={() => {
                    void createPaperMutation.mutateAsync();
                  }}
                >
                  {createPaperMutation.isPending ? "Creating..." : "Create paper"}
                </Button>
              </div>
            </div>

            {catalogQuery.data && !catalogQuery.data.ok ? (
              <Notice tone="error" className="mt-4 px-4 py-3">
                {catalogQuery.data.message}
              </Notice>
            ) : null}
            {createPaperMutation.data && !createPaperMutation.data.ok ? (
              <Notice tone="error" className="mt-4 px-4 py-3">
                {createPaperMutation.data.message}
              </Notice>
            ) : null}

            <div className="mt-4">
              {catalogQuery.isLoading ? (
                <EmptyState
                  title="Loading questions..."
                  description="Preparing paper catalog with your filters."
                  icon={LoaderCircle}
                />
              ) : (
                <QuestionCatalogSelector
                  rows={catalog?.rows ?? []}
                  lockedRows={lockedRows}
                  lockedTotal={lockedTotal}
                  selectedIds={selectedQuestionIds}
                  onToggle={(questionId) =>
                    setSelectedQuestionIds((current) =>
                      current.includes(questionId)
                        ? current.filter((id) => id !== questionId)
                        : [...current, questionId],
                    )
                  }
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
                  className="bg-white"
                  disabled={(catalog?.page ?? 1) <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="bg-white"
                  disabled={(catalog?.page ?? 1) >= (catalog?.totalPages ?? 1)}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Draft
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              {title.trim() || "Untitled paper"}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniStat label="Selected" value={String(selectedQuestionIds.length)} />
              <MiniStat label="Catalog" value={String(catalog?.total ?? 0)} />
              <MiniStat label="Answer key" value={includeAnswerKey ? "On" : "Off"} />
            </div>
            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <SummaryRow label="School" value={schoolName || "MM Exam Studio"} />
              <SummaryRow label="Academic year" value={academicYear || "Not set"} />
              <SummaryRow
                label="Instructions"
                value={instructions.trim() ? "Custom" : "Default print instructions"}
              />
              {summary ? <SummaryRow label="Plan" value={summary.subscription.name} /> : null}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                disabled={!canCreate}
                onClick={() => {
                  void createPaperMutation.mutateAsync();
                }}
              >
                {createPaperMutation.isPending ? "Creating..." : "Create paper"}
              </Button>
              {selectedQuestionIds.length > 0 ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={() => setSelectedQuestionIds([])}
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear selection
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-3 z-10 sm:hidden">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Paper draft
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {selectedQuestionIds.length} selected
              </p>
            </div>
            <Button
              disabled={!canCreate}
              onClick={() => {
                void createPaperMutation.mutateAsync();
              }}
            >
              {createPaperMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
