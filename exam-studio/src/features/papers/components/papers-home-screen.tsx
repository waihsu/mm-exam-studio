import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ScopePickerSheet } from "@/components/ui/scope-picker-sheet";
import { useTranslation } from "@/i18n";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import {
  PAPER_GUIDE_STEPS,
  PAPER_MIX_TYPES,
  toPaperQuestionTypeLabelKey,
  toPaperStatusLabel,
} from "./papers-home.config";
import {
  PaperBuilderSection,
  PapersHomeHeader,
  PapersQuickGuideSheet,
  PaperSetupSection,
  RecentExportsSection,
  SavedPapersSection,
} from "./papers-home-sections";
import { usePapersHomeController } from "../hooks/use-papers-home-controller";

export const PapersHomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const { formatDateTime } = useAppDateTimeFormatter();

  const {
    papersQuery,
    exportedPapersQuery,
    workspaceMetaQuery,
    createMutation,
    title,
    setTitle,
    count,
    setCount,
    includeAnswerKey,
    setIncludeAnswerKey,
    mixCounts,
    setMixCounts,
    papersSearch,
    setPapersSearch,
    papersStatusFilter,
    setPapersStatusFilter,
    exportsSearch,
    setExportsSearch,
    createError,
    helpSheetOpen,
    setHelpSheetOpen,
    activeScopePicker,
    setActiveScopePicker,
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
    configuredMixCount,
    quickTypeCountsQuery,
    papersRefresh,
    filteredSavedPapers,
    filteredExportedPapers,
    clearFilters,
    selectScopeValue,
    createQuickGeneratedPaper,
  } = usePapersHomeController({
    scopeLabels: {
      grade: t("filters.grade"),
      subject: t("filters.subject"),
      chapter: t("filters.chapter"),
      lesson: t("filters.lesson"),
      allGrades: t("home.scopeAllGrades"),
      allSubjects: t("home.scopeAllSubjects"),
      allChapters: t("home.scopeAllChapters"),
      allLessons: t("home.scopeAllLessons"),
    },
    createFailedMessage: t("home.failedCreate"),
    onPaperCreated: (paperId) => {
      router.push(`/papers/${paperId}` as RelativePathString);
    },
  });

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={papersRefresh.refreshing}
            onRefresh={() => {
              void papersRefresh.onRefresh();
            }}
          />
        }
      >
        <PapersHomeHeader
          title={t("home.title")}
          openHelpLabel={t("home.openHelp")}
          onOpenHelp={() => setHelpSheetOpen(true)}
        />

        <PaperSetupSection
          title={t("home.buildTitle")}
          paperTitleLabel={t("home.paperTitle")}
          paperTitle={title}
          paperTitlePlaceholder={t("home.paperTitlePlaceholder")}
          onTitleChange={setTitle}
          loadingLabel={workspaceMetaQuery.isLoading ? t("home.loadingWorkspaceFilters") : null}
          errorMessage={
            workspaceMetaQuery.isError
              ? workspaceMetaQuery.error instanceof Error
                ? workspaceMetaQuery.error.message
                : t("home.failedWorkspaceFilters")
              : null
          }
          includeAnswerKeyLabel={t("home.includeAnswerKey")}
          includeAnswerKey={includeAnswerKey}
          onToggleAnswerKey={() => setIncludeAnswerKey((value) => !value)}
          templatesLabel={t("templates.openCatalog")}
          onOpenTemplates={() => router.push("/papers/templates" as RelativePathString)}
        />

        <PaperBuilderSection
          title={t("home.quickGenerate")}
          scopeTitle={t("home.scopeTitle")}
          clearLabel={t("common:actions.clear")}
          onClear={clearFilters}
          scopeItems={[
            { key: "grade", label: t("filters.grade"), value: scopeSummary.grade },
            { key: "subject", label: t("filters.subject"), value: scopeSummary.subject },
            { key: "chapter", label: t("filters.chapter"), value: scopeSummary.chapter },
            { key: "lesson", label: t("filters.lesson"), value: scopeSummary.lesson },
          ]}
          onScopePress={(key) => setActiveScopePicker(key)}
          mixTitle={t("home.mixTitle")}
          mixHint={t("home.mixHint")}
          mixTotalLabel={t("home.mixTotal", { count: configuredMixCount })}
          mixItems={PAPER_MIX_TYPES.map((type) => ({
            key: type,
            label: t(toPaperQuestionTypeLabelKey(type)),
            helper:
              type === "long_answer"
                ? t("home.mixLongAnswerHelper")
                : t("home.mixPerTypeHelper"),
            value: mixCounts[type],
            availableCount: quickTypeCountsQuery.counts[type] ?? undefined,
            onChange: (value) => {
              setMixCounts((current) => ({
                ...current,
                [type]: value.length > 0 ? value : "0",
              }));
            },
          }))}
          showCount={configuredMixCount === 0}
          countLabel={t("home.questionCount")}
          countValue={count}
          countPlaceholder={t("home.questionCountPlaceholder")}
          onCountChange={setCount}
          errorMessage={createError}
          actionLabel={
            configuredMixCount > 0
              ? t("home.generatePlannedDraft")
              : t("home.quickGenerateDraft")
          }
          actionDisabled={!title.trim() || createMutation.isPending}
          onSubmit={createQuickGeneratedPaper}
        />

        <SavedPapersSection
          title={t("home.savedPapers")}
          searchPlaceholder={t("home.savedSearchPlaceholder")}
          searchValue={papersSearch}
          onSearchChange={setPapersSearch}
          filters={[
            { value: "all", label: t("common:filters.all") },
            { value: "draft", label: t("status.draft") },
            { value: "finalized", label: t("status.finalized") },
            { value: "exported", label: t("status.exported") },
          ]}
          activeFilter={papersStatusFilter}
          onFilterChange={(value) =>
            setPapersStatusFilter(value as "all" | "draft" | "finalized" | "exported")
          }
          loadingLabel={papersQuery.isLoading ? t("home.loadingPapers") : null}
          errorMessage={
            papersQuery.isError
              ? papersQuery.error instanceof Error
                ? papersQuery.error.message
                : t("home.failedPapers")
              : null
          }
          showEmptyState={
            !papersQuery.isLoading &&
            !papersQuery.isError &&
            (papersQuery.data?.rows.length ?? 0) === 0
          }
          emptyTitle={t("home.noPapers")}
          emptyHint={t("home.noPapersHint")}
          showNoMatchesState={
            !papersQuery.isLoading &&
            !papersQuery.isError &&
            (papersQuery.data?.rows.length ?? 0) > 0 &&
            filteredSavedPapers.length === 0
          }
          noMatchesTitle={t("home.noSavedMatches")}
          noMatchesHint={t("home.noSavedMatchesHint")}
          rows={filteredSavedPapers}
          formatUpdated={(value) => t("home.updated", { value: formatDateTime(value) })}
          toStatusLabel={(status, exportedAt) => t(toPaperStatusLabel(status, exportedAt))}
        />

        <RecentExportsSection
          title={t("home.recentExports")}
          searchPlaceholder={t("home.exportsSearchPlaceholder")}
          searchValue={exportsSearch}
          onSearchChange={setExportsSearch}
          loadingLabel={exportedPapersQuery.isLoading ? t("home.loadingExports") : null}
          errorMessage={
            exportedPapersQuery.isError
              ? exportedPapersQuery.error instanceof Error
                ? exportedPapersQuery.error.message
                : t("home.failedExports")
              : null
          }
          showEmptyState={
            !exportedPapersQuery.isLoading &&
            !exportedPapersQuery.isError &&
            (exportedPapersQuery.data?.rows.length ?? 0) === 0
          }
          emptyTitle={t("home.noExports")}
          emptyHint={t("home.noExportsHint")}
          showNoMatchesState={
            !exportedPapersQuery.isLoading &&
            !exportedPapersQuery.isError &&
            (exportedPapersQuery.data?.rows.length ?? 0) > 0 &&
            filteredExportedPapers.length === 0
          }
          noMatchesTitle={t("home.noExportMatches")}
          noMatchesHint={t("home.noExportMatchesHint")}
          rows={filteredExportedPapers.slice(0, 5)}
          formatExportedAt={(value) => t("home.exportedAt", { value: formatDateTime(value) })}
          exportedLabel={t("status.exported")}
        />

        <ScopePickerSheet
          visible={activeScopePicker !== null}
          title={activeScopePickerLabel ?? t("home.scopeTitle")}
          subtitle={t("home.scopeSheetSubtitle")}
          options={activeScopePickerOptions}
          selectedValue={activeScopePickerValue}
          clearLabel={t("common:actions.clear")}
          doneLabel={t("common:actions.done")}
          onSelect={selectScopeValue}
          onClear={clearFilters}
          onClose={() => setActiveScopePicker(null)}
        />

        <PapersQuickGuideSheet
          visible={helpSheetOpen}
          title={t("home.papersQuickGuide")}
          subtitle={t("home.papersQuickGuideSubtitle")}
          closeLabel={t("common:actions.close")}
          fullGuideLabel={t("home.fullGuide")}
          steps={PAPER_GUIDE_STEPS.map((step) => ({
            title: t(step.titleKey),
            hint: t(step.hintKey),
            icon: step.icon,
            accentColor: step.accentColor,
            accentSoft: step.accentSoft,
          }))}
          onClose={() => setHelpSheetOpen(false)}
          onOpenFullGuide={() => {
            setHelpSheetOpen(false);
            router.push("/settings/help" as RelativePathString);
          }}
        />
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
});
