import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  LoaderCircle,
  Pencil,
  Printer,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";
import { BrandAssetPicker } from "@/features/workspace/components/brand-asset-picker";
import { QuestionPaperEditor } from "@/features/workspace/components/question-paper-editor";
import { PaperPreview } from "@/features/workspace/components/paper-preview";
import {
  buildQuestionPaperForm,
  useQuestionPaperDetail,
  type QuestionPaperFormState,
} from "@/features/workspace/hooks/use-question-paper-detail";

export function QuestionPaperDetailPage({ paperId }: { paperId: string }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [showFinalizePrompt, setShowFinalizePrompt] = useState(false);
  const [form, setForm] = useState<QuestionPaperFormState>(buildQuestionPaperForm(null));
  const { paperQuery, brandingQuery, pdfMutation, updateMutation, statusMutation, duplicateMutation, deleteMutation } =
    useQuestionPaperDetail(paperId);

  const paper = paperQuery.data?.ok ? paperQuery.data.data : null;
  const brandAssets = brandingQuery.data?.ok ? brandingQuery.data.data.rows : [];
  const isDraft = paper?.status === "draft";
  const canReopenToDraft = paper?.status === "finalized" && !paper.exportedAt;
  const canFinalize = Boolean(paper && paper.totalQuestions > 0);

  const finalizePaper = () => {
    setShowFinalizePrompt(false);
    void statusMutation.mutateAsync("finalized");
  };
  const duplicateForEditing = () => {
    void duplicateMutation.mutateAsync().then((response) => {
      if (!response.ok) return;
      void navigate({
        to: "/question-papers/$paperId",
        params: { paperId: response.data.id },
      });
    });
  };

  useEffect(() => {
    if (!paper) return;
    setForm(buildQuestionPaperForm(paper));
  }, [paper]);

  useEffect(() => {
    if (!paper) return;
    setShowDraftPreview(paper.status !== "draft");
  }, [paper]);

  if (paperQuery.isLoading) {
    return (
      <EmptyState title="Loading paper..." icon={LoaderCircle} />
    );
  }

  if (paperQuery.data && !paperQuery.data.ok) {
    return (
      <div className="space-y-4">
        <Notice tone="error" className="p-4">
          {paperQuery.data.message}
        </Notice>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        {paper ? (
          <PageHeader
            eyebrow={paper.exportedAt ? "exported" : paper.status}
            title={paper.title}
            description={
                  paper.exportedAt
                ? `Last exported ${new Date(paper.exportedAt).toLocaleString("en-US")}`
                : isDraft
                  ? "Review the questions, then finalize when this is the version you want to print."
                  : "Ready to print/export"
            }
            chips={
              <>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {paper.totalQuestions} questions
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {paper.totalMarks} total marks
                </span>
                {[paper.grade?.name, paper.subject?.name, paper.chapter?.name, paper.subChapter?.name]
                  .filter(Boolean)
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
              </>
            }
            actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button asChild variant="outline" className="bg-white">
                <Link to="/question-papers">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button variant="outline" className="bg-white" disabled={isDraft} onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                {isDraft ? "Finalize to print" : "Print"}
              </Button>
              <Button
                disabled={pdfMutation.isPending || paper.status !== "finalized"}
                onClick={() => {
                  void pdfMutation.mutateAsync();
                }}
              >
                <Printer className="h-4 w-4" />
                {pdfMutation.isPending ? "Opening..." : "Open PDF"}
              </Button>
              {isDraft ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  disabled={statusMutation.isPending || !canFinalize}
                  onClick={() => setShowFinalizePrompt(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {statusMutation.isPending ? "Finalizing..." : "Finalize"}
                </Button>
              ) : canReopenToDraft ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    void statusMutation.mutateAsync("draft");
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {statusMutation.isPending ? "Updating..." : "Back to draft"}
                </Button>
              ) : null}
              {paper.exportedAt ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  disabled={duplicateMutation.isPending}
                  onClick={duplicateForEditing}
                >
                  <Copy className="h-4 w-4" />
                  {duplicateMutation.isPending ? "Creating copy..." : "Duplicate to edit"}
                </Button>
              ) : null}
              {isEditing ? (
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={() => {
                    setIsEditing(false);
                    setForm(buildQuestionPaperForm(paper));
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-white"
                  disabled={!isDraft}
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit details
                </Button>
              )}
              <Button
                variant="outline"
                className="bg-white text-red-600 hover:text-red-700"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (!window.confirm("Delete this paper? This cannot be undone.")) {
                    return;
                  }
                  void deleteMutation.mutateAsync().then((response) => {
                    if (!response.ok) return;
                    void navigate({ to: "/question-papers" });
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>}
          />
        ) : (
          <EmptyState title="Loading paper..." icon={LoaderCircle} className="bg-white/80 py-6" />
        )}
      </div>

      {pdfMutation.data?.ok ? (
        <Notice tone="success" className="print:hidden">
          PDF opened for printing and export recorded.
        </Notice>
      ) : null}

      {pdfMutation.data && !pdfMutation.data.ok ? (
        <Notice tone="error" className="print:hidden">
          {pdfMutation.data.message}
        </Notice>
      ) : null}

      {updateMutation.data && !updateMutation.data.ok ? (
        <Notice tone="error" className="print:hidden">
          {updateMutation.data.message}
        </Notice>
      ) : null}

      {statusMutation.data && !statusMutation.data.ok ? (
        <Notice tone="error" className="print:hidden">
          {statusMutation.data.message}
        </Notice>
      ) : null}

      {deleteMutation.data && !deleteMutation.data.ok ? (
        <Notice tone="error" className="print:hidden">
          {deleteMutation.data.message}
        </Notice>
      ) : null}

      {paper ? (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4 print:hidden xl:sticky xl:top-6 xl:self-start">
            {isEditing ? (
              <SectionCard
                title="Paper Details"
                actions={
                  <Button
                    disabled={!form.title.trim() || updateMutation.isPending}
                    onClick={() => {
                      void updateMutation.mutateAsync(form).then((response) => {
                        if (!response.ok) return;
                        setIsEditing(false);
                      });
                    }}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                }
              >
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Title
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      School
                    </span>
                    <input
                      value={form.schoolName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, schoolName: event.target.value }))
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Academic year
                    </span>
                    <input
                      value={form.academicYear}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, academicYear: event.target.value }))
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                    />
                  </label>
                  <div className="space-y-2">
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
                      value={form.brandAssetId}
                      onChange={(value) => setForm((current) => ({ ...current, brandAssetId: value }))}
                      disabled={!isDraft}
                    />
                  </div>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Instructions
                    </span>
                    <textarea
                      value={form.instructions}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instructions: event.target.value }))
                      }
                      className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-900"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.includeAnswerKey}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, includeAnswerKey: event.target.checked }))
                      }
                    />
                    Include answer key
                  </label>
                </div>
              </SectionCard>
            ) : null}

              <SectionCard title="Print Summary">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <MiniInfo label="Questions" value={String(paper.totalQuestions)} />
                <MiniInfo label="Marks" value={String(paper.totalMarks)} />
                <MiniInfo label="Status" value={paper.exportedAt ? "exported" : paper.status} />
              </div>
              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <MetaRow label="School" value={paper.schoolName || "MM Exam Studio"} />
                <MetaRow label="Academic year" value={paper.academicYear || "Not set"} />
                <MetaRow label="Branding" value={paper.brandAsset?.label || "Default header"} />
                <MetaRow label="Answer key" value={paper.includeAnswerKey ? "Included" : "Hidden"} />
                <MetaRow
                  label="Exported"
                  value={paper.exportedAt ? new Date(paper.exportedAt).toLocaleString("en-US") : "Not yet"}
                />
                <MetaRow
                  label="Editing"
                  value={isDraft ? "Swap and reorder available" : "Locked after finalizing"}
                />
              </div>
            </SectionCard>

            {isDraft ? (
              <SectionCard title="Next step" description="A paper becomes printable only after final review.">
                <p className="text-sm leading-6 text-slate-600">
                  {canFinalize
                    ? "Check the printable preview, make any swaps you need, then finalize this exact question set."
                    : "Add at least one question before you can finalize this paper."}
                </p>
                <Button
                  className="mt-4 w-full"
                  disabled={statusMutation.isPending || !canFinalize}
                  onClick={() => setShowFinalizePrompt(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalize paper
                </Button>
              </SectionCard>
            ) : paper.exportedAt ? (
              <SectionCard title="Editing an exported paper" description="The exported version stays unchanged for a reliable record.">
                <p className="text-sm leading-6 text-slate-600">
                  Need a correction? Create an editable draft copy. Your original PDF and export date stay exactly as they are.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full bg-white"
                  disabled={duplicateMutation.isPending}
                  onClick={duplicateForEditing}
                >
                  <Copy className="h-4 w-4" />
                  {duplicateMutation.isPending ? "Creating copy..." : "Duplicate to edit"}
                </Button>
              </SectionCard>
            ) : null}
          </aside>

          <section className="space-y-4">
            {isDraft ? (
              <SectionCard
                title="Printable Preview"
                description="Toggle while editing draft."
                className="print:hidden"
                actions={
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={() => setShowDraftPreview((current) => !current)}
                  >
                    {showDraftPreview ? "Hide preview" : "Show preview"}
                  </Button>
                }
              >
                <></>
              </SectionCard>
            ) : null}

            {showDraftPreview || !isDraft ? (
              <section className="paper-print-root rounded-xl border border-slate-200 bg-white p-4 print:border-none print:bg-white print:p-0 print:shadow-none">
                <PaperPreview paper={paper} />
              </section>
            ) : (
              <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 print:hidden">
                Preview hidden while editing.
              </section>
            )}
          </section>
        </div>
      ) : null}

      {paper && isDraft ? (
        <section className="space-y-4 print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Draft editor
            </p>
            <p className="mt-1 text-sm text-slate-600">Swap, remove, and reorder questions.</p>
          </div>
          <QuestionPaperEditor paperId={paper.id} showHeader={false} />
        </section>
      ) : null}

      {paper ? (
        <div className="sticky bottom-3 z-10 sm:hidden print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Paper
                </p>
                <p className="text-sm font-semibold text-slate-900">{paper.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {isDraft ? (
                  <Button disabled={statusMutation.isPending || !canFinalize} onClick={() => setShowFinalizePrompt(true)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Finalize
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="bg-white" onClick={() => window.print()}>
                      Print
                    </Button>
                    <Button
                      disabled={pdfMutation.isPending}
                      onClick={() => {
                        void pdfMutation.mutateAsync();
                      }}
                    >
                      {pdfMutation.isPending ? "Opening..." : "Open PDF"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {duplicateMutation.data && !duplicateMutation.data.ok ? (
        <Notice tone="error" className="print:hidden">
          {duplicateMutation.data.message}
        </Notice>
      ) : null}

      {showFinalizePrompt && paper ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="finalize-paper-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <p className="ui-kicker text-indigo-700">Ready for final review?</p>
                <h2 id="finalize-paper-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Finalize this paper</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">This locks question editing for <strong>{paper.title}</strong>. You can return to draft before its first PDF export; after export, make a new draft for changes.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowFinalizePrompt(false)}>Keep editing</Button>
              <Button className="rounded-xl" disabled={statusMutation.isPending} onClick={finalizePaper}>{statusMutation.isPending ? "Finalizing..." : "Finalize paper"}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
