import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, FolderOpen, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
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
    <div className="space-y-4">
      <div className="app-hero flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Question Papers
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{papers.length} saved</h2>
          <p className="mt-1 text-sm text-slate-500">Manage drafts and exports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="Drafts" value={String(draftPapers.length)} />
          <StatPill label="Finalized" value={String(finalizedPapers.length)} />
          <StatPill label="Exported" value={String(exportedCount)} />
          <Button asChild>
            <Link to="/question-papers/new">New paper</Link>
          </Button>
        </div>
      </div>

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

      <section className="reveal-up reveal-delay-2 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Recent exports</p>
            <p className="mt-1 text-sm text-slate-500">Latest PDF exports.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
            {exportedCount} total
          </span>
        </div>

        <div className="mt-4 space-y-3">
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
      </section>
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
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
          {rows.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {rows.length > 0 ? (
          rows.map((paper) => (
            <Link
              key={paper.id}
              to="/question-papers/$paperId"
              params={{ paperId: paper.id }}
            className="hover-lift block rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaperStatusPill paper={paper} />
                    <p className="text-xs font-semibold text-slate-500">
                      Updated {new Date(paper.updatedAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{paper.title}</h3>
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
              <p className="mt-3 text-sm text-slate-500">
                {paper.exportedAt
                  ? `Exported ${new Date(paper.exportedAt).toLocaleString("en-US")}`
                  : `Updated ${new Date(paper.updatedAt).toLocaleDateString("en-US")}`}
              </p>
            </Link>
          ))
        ) : (
          <EmptyState title={emptyLabel} icon={FolderOpen} className="lg:col-span-2" />
        )}
      </div>
    </section>
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

function StatPill({ label, value }: { label: string; value: string }) {
  const tone =
    label === "Drafts"
      ? "bg-amber-100 text-amber-800"
      : label === "Finalized"
        ? "bg-sky-100 text-sky-800"
        : "bg-emerald-100 text-emerald-800";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>
      {label} {value}
    </span>
  );
}
