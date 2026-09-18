import { useRouter, type RelativePathString } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useDeleteQuestionPaperMutation } from "./use-delete-question-paper-mutation";
import { useMarkQuestionPaperExportedMutation } from "./use-mark-question-paper-exported-mutation";
import { useQuestionPaperDetailQuery } from "./use-question-paper-detail-query";
import { useQuestionPaperSwapCandidatesQuery } from "./use-question-paper-swap-candidates-query";
import { useRemoveQuestionPaperItemMutation } from "./use-remove-question-paper-item-mutation";
import { useReorderQuestionPaperItemsMutation } from "./use-reorder-question-paper-items-mutation";
import { useSwapQuestionPaperItemMutation } from "./use-swap-question-paper-item-mutation";
import { useUpdateQuestionPaperMutation } from "./use-update-question-paper-mutation";
import { useUpdateQuestionPaperStatusMutation } from "./use-update-question-paper-status-mutation";
import {
  buildReorderedPaperItemIds,
  normalizePaperOptionalText,
} from "../utils/paper-detail";

export type PaperDetailConfirmAction =
  | { kind: "remove-item"; itemId: string }
  | { kind: "delete-paper"; paperId: string }
  | { kind: "export-pdf"; paperId: string };

export function usePaperDetailController(paperId: string) {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const { formatDateTime } = useAppDateTimeFormatter();
  const detailQuery = useQuestionPaperDetailQuery(paperId);
  const updateMutation = useUpdateQuestionPaperMutation(paperId);
  const statusMutation = useUpdateQuestionPaperStatusMutation(paperId);
  const reorderMutation = useReorderQuestionPaperItemsMutation(paperId);
  const swapMutation = useSwapQuestionPaperItemMutation(paperId);
  const removeItemMutation = useRemoveQuestionPaperItemMutation(paperId);
  const exportMutation = useMarkQuestionPaperExportedMutation(paperId);
  const deleteMutation = useDeleteQuestionPaperMutation();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [swapItemId, setSwapItemId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<PaperDetailConfirmAction | null>(null);
  const paper = detailQuery.data;
  const isDraft = paper?.status === "draft";
  const canBackToDraft = paper?.status === "finalized" && !paper.exportedAt;
  const swapCandidatesQuery = useQuestionPaperSwapCandidatesQuery(
    paperId,
    swapItemId,
    isDraft
  );

  useEffect(() => {
    if (!paper) return;
    setTitle(paper.title);
    setInstructions(paper.instructions ?? "");
    setSchoolName(paper.schoolName ?? "");
    setAcademicYear(paper.academicYear ?? "");
    setIncludeAnswerKey(paper.includeAnswerKey);
  }, [paper]);

  useEffect(() => {
    if (!paper || !swapItemId) return;
    if (!paper.items.some(item => item.id === swapItemId)) setSwapItemId(null);
  }, [paper, swapItemId]);

  const hasActionPending = useMemo(
    () =>
      updateMutation.isPending ||
      statusMutation.isPending ||
      reorderMutation.isPending ||
      swapMutation.isPending ||
      removeItemMutation.isPending ||
      exportMutation.isPending ||
      deleteMutation.isPending,
    [
      deleteMutation.isPending,
      exportMutation.isPending,
      removeItemMutation.isPending,
      reorderMutation.isPending,
      statusMutation.isPending,
      swapMutation.isPending,
      updateMutation.isPending,
    ]
  );
  const exportStateLabel = paper?.exportedAt
    ? t("papers:status.exportReady")
    : paper?.status === "finalized"
      ? t("papers:status.readyToGenerate")
      : t("papers:status.draftOnly");
  const exportStateHint = paper?.exportedAt
    ? t("papers:detail.exportHintReady")
    : paper?.status === "finalized"
      ? t("papers:detail.exportHintPending")
      : t("papers:detail.exportHintDraft");
  const metadataDirty = useMemo(() => {
    if (!paper) return false;
    return (
      title.trim() !== paper.title ||
      instructions.trim() !== (paper.instructions ?? "") ||
      schoolName.trim() !== (paper.schoolName ?? "") ||
      academicYear.trim() !== (paper.academicYear ?? "") ||
      includeAnswerKey !== paper.includeAnswerKey
    );
  }, [academicYear, includeAnswerKey, instructions, paper, schoolName, title]);

  const backToPapers = () => router.replace("/papers" as RelativePathString);
  const saveMetadata = async () => {
    if (!paper || !isDraft || hasActionPending || !title.trim()) return;
    setActionMessage(null);
    try {
      await updateMutation.mutateAsync({
        title: title.trim(),
        instructions: normalizePaperOptionalText(instructions),
        schoolName: normalizePaperOptionalText(schoolName),
        academicYear: normalizePaperOptionalText(academicYear),
        includeAnswerKey,
      });
      setActionMessage(t("papers:detail.saved"));
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : t("papers:detail.saveFailed")
      );
    }
  };
  const finalizeOrReopen = async () => {
    if (!paper || hasActionPending) return;

    if (paper.status === "draft" && metadataDirty) {
      setActionMessage(t("papers:detail.saveBeforeFinalize"));
      return;
    }

    setActionMessage(null);
    const nextStatus = paper.status === "draft" ? "finalized" : "draft";
    try {
      await statusMutation.mutateAsync(nextStatus);
      setActionMessage(
        nextStatus === "finalized"
          ? t("papers:detail.finalizedMessage")
          : t("papers:detail.draftMessage")
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : t("papers:detail.statusFailed")
      );
    }
  };
  const moveItem = async (itemId: string, direction: "up" | "down") => {
    if (!paper || !isDraft || hasActionPending) return;
    const nextItemIds = buildReorderedPaperItemIds(
      paper.items,
      itemId,
      direction
    );
    if (!nextItemIds) return;
    setActionMessage(null);
    try {
      await reorderMutation.mutateAsync(nextItemIds);
      setActionMessage(t("papers:detail.orderUpdated"));
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : t("papers:detail.reorderFailed")
      );
    }
  };
  const requestRemoveItem = (itemId: string) => {
    if (!paper || !isDraft || hasActionPending) return;
    setConfirmAction({ kind: "remove-item", itemId });
  };
  const swapItem = async (itemId: string, candidateQuestionId?: string) => {
    if (!paper || !isDraft || hasActionPending) return;
    setActionMessage(null);
    try {
      await swapMutation.mutateAsync({ itemId, candidateQuestionId });
      setSwapItemId(null);
      setActionMessage(t("papers:detail.replacementApplied"));
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : t("papers:detail.swapFailed")
      );
    }
  };
  const requestExportPdf = () => {
    if (!paper || hasActionPending || paper.status !== "finalized") return;
    setConfirmAction({ kind: "export-pdf", paperId: paper.id });
  };
  const markExported = async (targetPaperId: string) => {
    if (!paper || hasActionPending || paper.id !== targetPaperId) return;
    setActionMessage(null);
    try {
      await exportMutation.mutateAsync();
      setActionMessage(t("papers:detail.exportRecorded"));
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : t("papers:detail.exportFailed")
      );
    }
  };
  const openPdf = () => {
    if (!paper?.exportedAt || hasActionPending) return;
    setActionMessage(null);
    router.push(`/papers/preview/${paper.id}` as RelativePathString);
  };
  const requestDeletePaper = () => {
    if (!paper || hasActionPending) return;
    setConfirmAction({ kind: "delete-paper", paperId: paper.id });
  };
  const confirmPaperAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.kind === "remove-item") {
      setActionMessage(null);
      try {
        await removeItemMutation.mutateAsync(confirmAction.itemId);
        setSwapItemId(currentItemId =>
          currentItemId === confirmAction.itemId ? null : currentItemId
        );
        setActionMessage(t("papers:detail.removed"));
      } catch (error) {
        setActionMessage(
          error instanceof Error
            ? error.message
            : t("papers:detail.removeFailed")
        );
      } finally {
        setConfirmAction(null);
      }
      return;
    }
    if (confirmAction.kind === "export-pdf") {
      try {
        await markExported(confirmAction.paperId);
      } finally {
        setConfirmAction(null);
      }
      return;
    }
    try {
      await deleteMutation.mutateAsync(confirmAction.paperId);
      setConfirmAction(null);
      router.replace("/papers" as RelativePathString);
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : t("papers:detail.deleteFailed")
      );
      setConfirmAction(null);
    }
  };

  return {
    academicYear,
    actionMessage,
    backToPapers,
    canBackToDraft,
    confirmAction,
    confirmPaperAction,
    deleteMutation,
    exportMutation,
    exportStateHint,
    exportStateLabel,
    finalizeOrReopen,
    formatDateTime,
    hasActionPending,
    includeAnswerKey,
    instructions,
    isDraft,
    markExported,
    metadataDirty,
    moveItem,
    openPdf,
    paper,
    removeItemMutation,
    requestDeletePaper,
    requestExportPdf,
    requestRemoveItem,
    saveMetadata,
    setAcademicYear,
    setConfirmAction,
    setIncludeAnswerKey,
    setInstructions,
    setSchoolName,
    setSwapItemId,
    setTitle,
    schoolName,
    statusMutation,
    swapCandidatesQuery,
    swapItem,
    swapItemId,
    title,
    detailQuery,
  };
}
