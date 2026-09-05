import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, FolderOpen, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SectionCard } from "@/components/ui/page-shell";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { QuestionPaperSummary } from "@/features/workspace/types";

export function QuestionPaperListPage() {
  const papersQuery = useQuery({
    queryKey: ["workspace-papers"],
    queryFn: () => workspaceApi.listQuestionPapers(),
  });

  const papers = papersQuery.data?.ok ? papersQuery.data.data.rows : [];
  const draftPapers = papers.filter((paper) => paper.status === "draft");
  const finalizedPapers = papers.filter((paper) => paper.status === "finalized");
  const exportedPapers = papers.filter((paper) => Boolean(paper.exportedAt));
  const exportedCount = exportedPapers.length;

  return (
    <div className="space-y-7 pb-4">
      <section className="relative isolate overflow-hidden rounded-[26px] bg-[#121b33] px-6 py-7 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.85)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_8%,rgba(111,99,255,0.42),transparent_31%),radial-gradient(circle_at_14%_115%,rgba(15,166,184,0.18),transparent_42%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="ui-kicker text-indigo-200">Paper studio</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3.45rem)] font-bold leading-[1.04] tracking-[-0.05em]">Your assessment workspace.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Draft, refine, finalize, and export papers without losing track of the stage each one is in.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10">
              <StudioStat label="Drafts" value={String(draftPapers.length)} />
              <StudioStat label="Final" value={String(finalizedPapers.length)} />
              <StudioStat label="Exported" value={String(exportedCount)} />
            </div>
            <Button asChild className="h-11 rounded-xl bg-white px-5 text-slate-950 hover:bg-indigo-50"><Link to="/question-papers/new"><Plus className="h-4 w-4" /> Create paper</Link></Button>
          </div>
        </div>
      </section>

      {papersQuery.data && !papersQuery.data.ok ? (
        <Notice tone="error">
          {papersQuery.data.message}
        </Notice>
      ) : null}

      {papersQuery.isLoading ? (
        <EmptyState
          title="Loading papers..."
          description="Fetching your saved drafts and finalized papers."
          icon={LoaderCircle}
          className="reveal-up"
        />
      ) : papers.length > 0 ? (
        <div className="space-y-5 reveal-up reveal-delay-1">
          <PaperSection
            title="Drafts"
            note="Still editable. Swap, reorder, and refine before finalizing."
            rows={draftPapers}
            emptyLabel="No draft papers yet."
          />
          <PaperSection
            title="Finalized"
            note="Locked and ready for printing or PDF export."
            rows={finalizedPapers}
            emptyLabel="No finalized papers yet."
          />
        </div>
      ) : (
        <EmptyState
          title="No papers yet"
          description="Create your first paper draft to start building exports."
          icon={FolderOpen}
          className="reveal-up"
        />
      )}

      <SectionCard
        title="Recent exports"
        description="Latest PDF exports."
        actions={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
            {exportedCount} total
          </span>
        }
        className="reveal-up reveal-delay-2"
      >
        <div className="space-y-3">
          {papersQuery.isLoading ? (
            <EmptyState
              title="Loading export activity..."
              icon={LoaderCircle}
              className="py-6"
            />
          ) : exportedPapers.length > 0 ? (
            exportedPapers.slice(0, 5).map((paper) => (
              <Link
                key={`export-${paper.id}`}
                to="/question-papers/$paperId"
                params={{ paperId: paper.id }}
                className="hover-lift block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{paper.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {paper.totalQuestions} questions • {paper.totalMarks} marks
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {paper.exportedAt
                      ? new Date(paper.exportedAt).toLocaleString("en-US")
                      : "Unknown time"}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="No exports yet"
              description="Finalize and export a paper to see it here."
              icon={FileText}
              className="py-6"
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function PaperSection({
  title,
  note,
  rows,
  emptyLabel,
}: {
  title: string;
  note: string;
  rows: QuestionPaperSummary[];
  emptyLabel: string;
}) {
  return (
    <SectionCard
      title={title}
      description={note}
      actions={
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
          {rows.length}
        </span>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.length > 0 ? (
          rows.map((paper) => (
            <Link
              key={paper.id}
              to="/question-papers/$paperId"
              params={{ paperId: paper.id }}
            className="group block rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-[0_16px_30px_-25px_rgba(15,23,42,0.32)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaperStatusPill paper={paper} />
                    <p className="text-xs font-semibold text-slate-500">
                      Updated {new Date(paper.updatedAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950 transition group-hover:text-indigo-700">{paper.title}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                  {paper.totalQuestions} questions
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {paper.totalMarks} marks
                </span>
                {paper.subject ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {paper.subject.name}
                  </span>
                ) : null}
                {paper.grade ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {paper.grade.name}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition group-hover:text-indigo-700">
                {paper.exportedAt
                  ? `Exported ${new Date(paper.exportedAt).toLocaleString("en-US")}`
                  : `Updated ${new Date(paper.updatedAt).toLocaleDateString("en-US")}`} <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          ))
        ) : (
          <EmptyState title={emptyLabel} icon={FolderOpen} className="lg:col-span-2" />
        )}
      </div>
    </SectionCard>
  );
}

function PaperStatusPill({ paper }: { paper: QuestionPaperSummary }) {
  if (paper.exportedAt) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
        Exported
      </span>
    );
  }

  if (paper.status === "finalized") {
    return (
      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-800">
        Finalized
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
      Draft
    </span>
  );
}

function StudioStat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[72px] bg-slate-950/30 px-3 py-3 text-center"><p className="text-lg font-extrabold tracking-tight text-white">{value}</p><p className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-indigo-200">{label}</p></div>;
}
