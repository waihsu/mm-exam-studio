import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ScopePickerSheet } from "@/components/ui/scope-picker-sheet";
import { useTranslation } from "@/i18n";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import {
  formatPracticeScore,
  PRACTICE_GUIDE_STEPS,
  PRACTICE_MIX_TYPES,
  PRACTICE_PRESETS,
  toPracticeQuestionTypeLabelKey,
} from "./practice-home.config";
import {
  PracticeHomeHeader,
  PracticeOnboardingSheet,
  PracticeQuickGuideSheet,
  PracticeBuilderSection,
  PracticeStartSection,
  RecentPracticeSessionsSection,
} from "./practice-home-sections";
import { useDeletePracticeSessionMutation } from "../hooks/use-delete-practice-session-mutation";
import { usePracticeHomeController } from "../hooks/use-practice-home-controller";

export const PracticeHomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["practice", "common"]);
  const { formatDateTime } = useAppDateTimeFormatter();
  const deleteSessionMutation = useDeletePracticeSessionMutation();

  const {
    workspaceMetaQuery,
    createSessionMutation,
    sessionsQuery,
    quickTypeCountsQuery,
    practiceRefresh,
    mixCounts,
    setMixCounts,
    actionError,
    helpSheetOpen,
    setHelpSheetOpen,
    activeScopePicker,
    setActiveScopePicker,
    onboardingVisible,
    configuredMixCount,
    activeMixTypes,
    exceedsAvailableMix,
    quickStartDisabled,
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
    clearFilters,
    resetMixToDefault,
    applyPracticePreset,
    selectScopeValue,
    quickStart,
    dismissOnboarding,
  } = usePracticeHomeController({
    scopeLabels: {
      grade: t("practice:filters.grade"),
      subject: t("practice:filters.subject"),
      chapter: t("practice:filters.chapter"),
      lesson: t("practice:filters.lesson"),
      allGrades: t("practice:home.scopeAllGrades"),
      allSubjects: t("practice:home.scopeAllSubjects"),
      allChapters: t("practice:home.scopeAllChapters"),
      allLessons: t("practice:home.scopeAllLessons"),
    },
    createFailedMessage: t("practice:home.createFailed"),
    plannedTitle: t("practice:home.plannedPracticeTitle"),
    quickTitle: t("practice:home.quickPracticeTitle"),
    onSessionCreated: (sessionId) => {
      router.push(`/practice/${sessionId}` as RelativePathString);
    },
  });

  const confirmDeleteSession = (sessionId: string) => {
    Alert.alert(
      t("practice:sessions.deleteTitle"),
      t("practice:sessions.deleteBody"),
      [
        {
          text: t("common:actions.cancel"),
          style: "cancel",
        },
        {
          text: t("practice:sessions.deleteAction"),
          style: "destructive",
          onPress: () => {
            deleteSessionMutation.mutate(sessionId, {
              onError: (error) => {
                Alert.alert(
                  t("practice:sessions.deleteFailedTitle"),
                  error instanceof Error ? error.message : t("practice:sessions.deleteFailed"),
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={practiceRefresh.refreshing}
            onRefresh={() => {
              void practiceRefresh.onRefresh();
            }}
          />
        }
      >
        <PracticeHomeHeader
          title={t("practice:home.title")}
          openHelpLabel={t("practice:home.openHelp")}
          onOpenHelp={() => setHelpSheetOpen(true)}
        />

        <PracticeBuilderSection
          title={t("practice:home.searchFiltersTitle")}
          mixTitle={t("practice:home.mixTitle")}
          mixHint={t("practice:home.mixHint")}
          mixTotalLabel={t("practice:home.mixTotal", { count: configuredMixCount })}
          scopeItems={[
            { key: "grade", label: t("practice:filters.grade"), value: scopeSummary.grade },
            { key: "subject", label: t("practice:filters.subject"), value: scopeSummary.subject },
            { key: "chapter", label: t("practice:filters.chapter"), value: scopeSummary.chapter },
            { key: "lesson", label: t("practice:filters.lesson"), value: scopeSummary.lesson },
          ]}
          onScopePress={(key) => setActiveScopePicker(key)}
          mixItems={PRACTICE_MIX_TYPES.map((type) => ({
            key: type,
            label: t(toPracticeQuestionTypeLabelKey(type)),
            helper:
              type === "matching"
                ? t("practice:home.mixMatchingHelper")
                : t("practice:home.mixPerTypeHelper"),
            value: mixCounts[type],
            availableCount: quickTypeCountsQuery.counts[type] ?? undefined,
            onChange: (value) => {
              setMixCounts((current) => ({
                ...current,
                [type]: value.length > 0 ? value : "0",
              }));
            },
          }))}
          presetTitle={t("practice:home.presets.title")}
          presetResetLabel={t("practice:home.presets.reset")}
          onResetPresets={resetMixToDefault}
          presets={PRACTICE_PRESETS.map((preset) => ({
            key: preset.key,
            label: t(preset.labelKey),
            onPress: () => applyPracticePreset(preset.values),
          }))}
          mixSummaryTitle={t("practice:home.mixSummaryTitle")}
          configuredMixCount={configuredMixCount}
          activeMixTypes={activeMixTypes}
          questionsLabel={t("practice:home.mixSummaryQuestions")}
          typesLabel={t("practice:home.mixSummaryTypes")}
          readyCopy={t("practice:home.mixSummaryReady")}
          fallbackCopy={t("practice:home.mixSummaryFallback")}
          tooLargeError={configuredMixCount > 50 ? t("practice:home.mixSummaryTooLarge") : null}
          unavailableError={exceedsAvailableMix ? t("practice:home.mixSummaryUnavailable") : null}
          isLoadingWorkspace={workspaceMetaQuery.isLoading}
          loadingWorkspaceLabel={t("practice:home.loadingWorkspaceFilters")}
          workspaceErrorMessage={
            workspaceMetaQuery.isError
              ? workspaceMetaQuery.error instanceof Error
                ? workspaceMetaQuery.error.message
                : t("practice:home.failedWorkspaceFilters")
              : null
          }
        />

        <ScopePickerSheet
          visible={activeScopePicker !== null}
          title={activeScopePickerLabel ?? t("practice:home.scopeSheetTitle")}
          subtitle={t("practice:home.scopeSheetSubtitle")}
          options={activeScopePickerOptions}
          selectedValue={activeScopePickerValue}
          clearLabel={t("common:actions.clear")}
          doneLabel={t("common:actions.done")}
          onSelect={selectScopeValue}
          onClear={clearFilters}
          onClose={() => setActiveScopePicker(null)}
        />

        <PracticeQuickGuideSheet
          visible={helpSheetOpen}
          title={t("practice:home.quickGuideTitle")}
          subtitle={t("practice:home.quickGuideSubtitle")}
          closeLabel={t("common:actions.close")}
          fullGuideLabel={t("practice:home.fullGuide")}
          bestPattern={t("practice:home.guideBestPattern")}
          steps={PRACTICE_GUIDE_STEPS.map((step) => ({
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

        <PracticeStartSection
          title={t("practice:home.generatorTitle")}
          errorMessage={actionError}
          actionDisabled={quickStartDisabled}
          actionLabel={
            configuredMixCount > 0
              ? t("practice:home.startPlannedMix")
              : t("practice:home.quickStart")
          }
          onStart={quickStart}
        />

        <RecentPracticeSessionsSection
          title={t("practice:home.recentSessionsTitle")}
          viewAllLabel={t("common:actions.viewAll")}
          onViewAll={() => router.push("/practice/sessions" as RelativePathString)}
          deleteActionLabel={t("practice:sessions.deleteAction")}
          deletingLabel={t("practice:sessions.deleting")}
          loadingLabel={sessionsQuery.isLoading ? t("practice:home.loadingSessions") : ""}
          errorMessage={
            sessionsQuery.isError
              ? sessionsQuery.error instanceof Error
                ? sessionsQuery.error.message
                : t("practice:home.failedSessions")
              : null
          }
          emptyTitle={t("practice:home.noSessions")}
          emptyHint={t("practice:home.noSessionsHint")}
          rows={sessionsQuery.data?.rows ?? []}
          scoreMeta={(scorePercent, count) =>
            t("practice:sessions.scoreMeta", {
              score: formatPracticeScore(scorePercent),
              count,
            })
          }
          startedMetaLabel={(value) =>
            t("practice:sessions.startedMeta", { date: formatDateTime(value) })
          }
          toStatusLabel={(status) =>
            status === "completed"
              ? t("practice:sessions.completed")
              : t("practice:sessions.started")
          }
          deletingSessionId={
            deleteSessionMutation.isPending ? (deleteSessionMutation.variables ?? null) : null
          }
          onDeleteSession={confirmDeleteSession}
        />

        <PracticeOnboardingSheet
          visible={onboardingVisible}
          title={t("practice:home.onboardingSheetTitle")}
          subtitle={t("practice:home.onboardingSheetSubtitle")}
          skipLabel={t("practice:home.onboardingSkip")}
          showGuideLabel={t("practice:home.onboardingShowGuide")}
          eyebrow={t("practice:home.onboardingEyebrow")}
          heroTitle={t("practice:home.onboardingTitle")}
          body={t("practice:home.onboardingBody")}
          hintTitle={t("practice:home.onboardingHintTitle")}
          hint={t("practice:home.onboardingHint")}
          steps={PRACTICE_GUIDE_STEPS.map((step) => ({
            title: t(step.titleKey),
            hint: t(step.hintKey),
            icon: step.icon,
            accentColor: step.accentColor,
            accentSoft: step.accentSoft,
          }))}
          onClose={() => {
            void dismissOnboarding();
          }}
          onSkip={() => {
            void dismissOnboarding();
          }}
          onShowGuide={() => {
            void dismissOnboarding().then(() => {
              setHelpSheetOpen(true);
            });
          }}
        />
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
  },
});
