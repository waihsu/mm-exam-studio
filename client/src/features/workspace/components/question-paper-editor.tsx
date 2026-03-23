import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  GripVertical,
  LoaderCircle,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { MathRichText } from "shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { QuestionPaperItem } from "@/features/workspace/types";

export function QuestionPaperEditor({
  paperId,
  showHeader = true,
}: {
  paperId: string;
  showHeader?: boolean;
}) {
  const queryClient = useQueryClient();
  const [draftItems, setDraftItems] = useState<QuestionPaperItem[]>([]);
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null);
  const [candidateItemId, setCandidateItemId] = useState<string | null>(null);

  const paperQuery = useQuery({
    queryKey: ["workspace-paper", paperId],
    queryFn: () => workspaceApi.getQuestionPaper(paperId),
  });
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary"],
    queryFn: () => workspaceApi.getSummary(),
  });
  const candidatesQuery = useQuery({
    queryKey: ["workspace-paper-candidates", paperId, candidateItemId],
    enabled: !!candidateItemId,
    queryFn: () => workspaceApi.listQuestionPaperSwapCandidates(paperId, candidateItemId!),
  });

  const paper = paperQuery.data?.ok ? paperQuery.data.data : null;
  const remainingSwaps =
    summaryQuery.data?.ok ? summaryQuery.data.data.subscription.remaining.paperSwaps : null;
  const candidateRows = candidatesQuery.data?.ok ? candidatesQuery.data.data.rows : [];

  useEffect(() => {
    if (!paper) return;
    setDraftItems(paper.items);
  }, [paper]);

  const hasOrderChanges = useMemo(() => {
    if (!paper) return false;
    return draftItems.map((item) => item.id).join("|") !== paper.items.map((item) => item.id).join("|");
  }, [draftItems, paper]);

  const reorderMutation = useMutation({
    mutationFn: () =>
      workspaceApi.reorderQuestionPaperItems(
        paperId,
        draftItems.map((item) => item.id),
      ),
    onSuccess: async (response) => {
      if (!response.ok) return;
      setDraftItems(response.data.items);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace-paper", paperId] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-papers"] }),
      ]);
    },
  });

  const swapMutation = useMutation({
    mutationFn: (payload: { itemId: string; candidateQuestionId?: string }) =>
      workspaceApi.swapQuestionPaperItem(paperId, payload.itemId, {
        candidateQuestionId: payload.candidateQuestionId,
      }),
    onSuccess: async (response) => {
      setSwappingItemId(null);
      setCandidateItemId(null);
      if (!response.ok) return;
      setDraftItems(response.data.items);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace-paper", paperId] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-papers"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-summary"] }),
      ]);
    },
    onError: () => {
      setSwappingItemId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => workspaceApi.removeQuestionPaperItem(paperId, itemId),
    onSuccess: async (response) => {
      if (!response.ok) return;
      if (candidateItemId && !response.data.items.some((item) => item.id === candidateItemId)) {
        setCandidateItemId(null);
      }
      setDraftItems(response.data.items);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace-paper", paperId] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-papers"] }),
      ]);
    },
  });

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftItems.length) return;

    setDraftItems((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy.map((entry, itemIndex) => ({
        ...entry,
        position: itemIndex + 1,
      }));
    });
  };

  if (paperQuery.isLoading) {
    return (
      <EmptyState
        title="Loading question editor..."
        description="Preparing draft items and current order."
        icon={LoaderCircle}
      />
    );
  }

  if (paperQuery.data && !paperQuery.data.ok) {
    return (
      <Notice tone="error" className="p-6">
        {paperQuery.data.message}
      </Notice>
    );
  }

  if (!paper) return null;

  const locked = paper.status !== "draft";

  return (
    <div className="space-y-5">
      {showHeader ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Question Editor
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{paper.title}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Change questions before finalizing.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Variable questions stay fixed until replaced.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="bg-white">
                <Link to="/question-papers/$paperId" params={{ paperId }}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to paper
                </Link>
              </Button>
              <Button
                variant="outline"
                className="bg-white"
                disabled={!hasOrderChanges || reorderMutation.isPending || locked}
                onClick={() => {
                  void reorderMutation.mutateAsync();
                }}
              >
                <Save className="h-4 w-4" />
                {reorderMutation.isPending ? "Saving..." : "Save order"}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {locked ? (
        <Notice tone="warning" className="px-4 py-4">
          This paper is finalized, so question editing is locked.
        </Notice>
      ) : null}

      {reorderMutation.data && !reorderMutation.data.ok ? (
        <Notice tone="error" className="px-4 py-4">
          {reorderMutation.data.message}
        </Notice>
      ) : null}

      {swapMutation.data && !swapMutation.data.ok ? (
        <Notice tone="error" className="px-4 py-4">
          {swapMutation.data.message}
        </Notice>
      ) : null}

      {removeMutation.data && !removeMutation.data.ok ? (
        <Notice tone="error" className="px-4 py-4">
          {removeMutation.data.message}
        </Notice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-3">
          {draftItems.map((item, index) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">
                      Q{index + 1}
                    </span>
                    <span>{item.questionCode}</span>
                    <span>{item.questionType.replace("_", " ")}</span>
                    <span>{item.marks} mark{item.marks > 1 ? "s" : ""}</span>
                  </div>
                  <MathRichText
                    content={item.body}
                    className="mt-3 text-sm font-medium leading-7 text-slate-900"
                  />
                  <p className="mt-3 text-sm text-slate-500">
                    This action changes only this question. The rest of the paper stays the same.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white"
                    disabled={index === 0 || locked}
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white"
                    disabled={index === draftItems.length - 1 || locked}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white"
                    disabled={locked}
                    onClick={() =>
                      setCandidateItemId((current) => (current === item.id ? null : item.id))
                    }
                  >
                    <Sparkles className="h-4 w-4" />
                    {candidateItemId === item.id ? "Hide choices" : "Swap question"}
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white"
                    disabled={locked || swapMutation.isPending}
                    onClick={() => {
                      setSwappingItemId(item.id);
                      void swapMutation.mutateAsync({ itemId: item.id });
                    }}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        swapMutation.isPending && swappingItemId === item.id ? "animate-spin" : ""
                      }`}
                    />
                    {swapMutation.isPending && swappingItemId === item.id ? "Swapping..." : "Quick random"}
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white text-red-600 hover:text-red-700"
                    disabled={locked || removeMutation.isPending}
                    onClick={() => {
                      if (!window.confirm("Remove this question from the paper?")) return;
                      void removeMutation.mutateAsync(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <GripVertical className="h-4 w-4" />
                <span>Use arrows for order. Swap to replace only this item.</span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  Item {index + 1}
                </span>
              </div>

              {candidateItemId === item.id ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Replacement candidates</p>
                    {candidatesQuery.isFetching ? (
                      <p className="text-xs text-slate-500">Loading...</p>
                    ) : null}
                  </div>

                  {candidatesQuery.data && !candidatesQuery.data.ok ? (
                    <Notice tone="error" className="mt-3 px-3 py-3">
                      {candidatesQuery.data.message}
                    </Notice>
                  ) : candidatesQuery.isLoading || candidatesQuery.isFetching ? (
                    <EmptyState
                      title="Looking for replacements..."
                      icon={LoaderCircle}
                      className="mt-3 bg-white py-6"
                    />
                  ) : candidateRows.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {candidateRows.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                {candidate.questionCode} • {candidate.type.replace("_", " ")} •{" "}
                                {candidate.marks} mark{candidate.marks > 1 ? "s" : ""}
                              </p>
                              <MathRichText
                                content={candidate.title || candidate.bodyPreview}
                                className="mt-2 text-sm leading-6 text-slate-900"
                              />
                            </div>
                            <Button
                              variant="outline"
                              className="bg-white"
                              disabled={swapMutation.isPending}
                              onClick={() => {
                                setSwappingItemId(item.id);
                                void swapMutation.mutateAsync({
                                  itemId: item.id,
                                  candidateQuestionId: candidate.id,
                                });
                              }}
                            >
                              Use this
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No manual candidates found"
                      description="Try quick random swap for this question."
                      icon={Sparkles}
                      className="mt-3 bg-white py-6"
                    />
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Draft summary
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniCard label="Questions" value={String(draftItems.length)} />
              <MiniCard
                label="Marks"
                value={String(draftItems.reduce((sum, item) => sum + item.marks, 0))}
              />
              <MiniCard
                label="Swaps left"
                value={remainingSwaps == null ? "Plan cap" : String(remainingSwaps)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Actions
            </p>
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full bg-white"
                disabled={!hasOrderChanges || reorderMutation.isPending || locked}
                onClick={() => {
                  void reorderMutation.mutateAsync();
                }}
              >
                <Save className="h-4 w-4" />
                Save order
              </Button>
              <Button
                variant="outline"
                className="w-full bg-white"
                disabled={!hasOrderChanges || locked}
                onClick={() => {
                  setDraftItems(paper.items);
                }}
              >
                <Undo2 className="h-4 w-4" />
                Reset draft order
              </Button>
              {showHeader ? (
                <Button asChild className="w-full">
                  <Link to="/question-papers/$paperId" params={{ paperId }}>
                    Back to paper
                  </Link>
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
