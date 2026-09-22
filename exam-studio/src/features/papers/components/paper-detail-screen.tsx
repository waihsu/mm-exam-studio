import { ScrollView, StyleSheet } from "react-native";
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import { PageStateCard } from "@/components/ui/state-blocks";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTranslation } from "@/i18n";
import { PaperDetailExportSection } from "./paper-detail-export-section";
import { PaperDetailDangerZone } from "./paper-detail-danger-zone";
import { PaperDetailLoadingState } from "./paper-detail-loading-state";
import { PaperDetailHeader } from "./paper-detail-header";
import { PaperDetailMetadataForm } from "./paper-detail-metadata-form";
import { PaperDetailQuestionList } from "./paper-detail-question-list";
import { usePaperDetailController } from "../hooks/use-paper-detail-controller";
import { getPaperConfirmationCopy } from "../utils/paper-detail";

type PaperDetailScreenProps = {
  paperId: string;
};

export const PaperDetailScreen = ({ paperId }: PaperDetailScreenProps) => {
  const { t } = useTranslation(["papers", "common"]);
  const controller = usePaperDetailController(paperId);
  const {
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
    swapCandidatesQuery,
    swapItem,
    swapItemId,
    title,
    detailQuery,
  } = controller;
  const confirmationCopy = getPaperConfirmationCopy(confirmAction?.kind, t);

  if (detailQuery.isLoading) {
    return (
      <AppShell>
        <PaperDetailLoadingState title={t("papers:detail.loading")} />
      </AppShell>
    );
  }

  if (detailQuery.isError || !paper) {
    return (
      <AppShell>
        <PageStateCard
          title={t("papers:detail.failedLoad")}
          hint={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : t("papers:detail.failedLoad")
          }
          actionLabel={t("papers:detail.backToPapers")}
          onAction={backToPapers}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PaperDetailHeader
          actionMessage={actionMessage}
          canBackToDraft={canBackToDraft}
          formatDateTime={formatDateTime}
          hasActionPending={hasActionPending}
          isDraft={isDraft}
          metadataDirty={metadataDirty}
          paper={paper}
          title={title}
          onBack={backToPapers}
          onFinalizeOrReopen={finalizeOrReopen}
          onSaveDraft={saveMetadata}
        />

        {!isDraft ? (
          <PaperDetailExportSection
            exportIsPending={exportMutation.isPending}
            exportStateHint={exportStateHint}
            exportStateLabel={exportStateLabel}
            formatDateTime={formatDateTime}
            hasActionPending={hasActionPending}
            paper={paper}
            onOpenPdf={openPdf}
            onRequestExport={requestExportPdf}
          />
        ) : null}

        <PaperDetailMetadataForm
          academicYear={academicYear}
          hasActionPending={hasActionPending}
          includeAnswerKey={includeAnswerKey}
          instructions={instructions}
          isDraft={isDraft}
          paper={paper}
          schoolName={schoolName}
          title={title}
          setAcademicYear={setAcademicYear}
          setIncludeAnswerKey={setIncludeAnswerKey}
          setInstructions={setInstructions}
          setSchoolName={setSchoolName}
          setTitle={setTitle}
        />

        <PaperDetailQuestionList
          hasActionPending={hasActionPending}
          includeAnswerKey={includeAnswerKey}
          isDraft={isDraft}
          paper={paper}
          swapCandidateError={swapCandidatesQuery.error}
          swapCandidates={swapCandidatesQuery.data?.rows ?? []}
          swapCandidatesFailed={swapCandidatesQuery.isError}
          swapCandidatesLoading={swapCandidatesQuery.isLoading}
          swapItemId={swapItemId}
          onMoveItem={moveItem}
          onRemoveItem={requestRemoveItem}
          onSetSwapItemId={setSwapItemId}
          onSwapItem={swapItem}
        />

        <PaperDetailDangerZone
          disabled={hasActionPending}
          onDelete={requestDeletePaper}
        />
      </ScrollView>

      <ConfirmationSheet
        visible={Boolean(confirmAction)}
        title={confirmationCopy.title}
        message={confirmationCopy.message}
        hint={confirmationCopy.hint}
        confirmLabel={confirmationCopy.confirmLabel}
        confirmTone={confirmationCopy.confirmTone}
        isPending={
          removeItemMutation.isPending ||
          deleteMutation.isPending ||
          exportMutation.isPending
        }
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          void confirmPaperAction();
        }}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
});
