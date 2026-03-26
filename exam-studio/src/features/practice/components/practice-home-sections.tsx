import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MiniHelpHint } from "@/components/ui/mini-help-hint";
import { QuestionMixBuilder } from "@/components/ui/question-mix-builder";
import { ScopeSummaryGrid } from "@/components/ui/scope-summary-grid";
import {
  CardListSkeleton,
  EmptyStateCard,
  InlineErrorState,
  InlineLoadingState,
} from "@/components/ui/state-blocks";
import type {
  PracticeQuestionType,
  PracticeSessionListRow,
  PracticeSessionStatus,
} from "../types/practice.types";

type ScopePickerKey = "grade" | "subject" | "chapter" | "lesson";
type GuideStep = {
  title: string;
  hint: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
};

export const PracticeHomeHeader = ({
  title,
  openHelpLabel,
  onOpenHelp,
}: {
  title: string;
  openHelpLabel: string;
  onOpenHelp: () => void;
}) => (
  <View style={styles.headerBlock}>
    <View style={styles.headerRow}>
      <Text style={styles.heading}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={openHelpLabel}
        style={({ pressed }) => [styles.helpIconButton, pressed && styles.buttonPressed]}
        onPress={onOpenHelp}
      >
        <SymbolView
          name={{
            ios: "questionmark.circle.fill",
            android: "help",
            web: "help",
          }}
          size={18}
          tintColor="#1D4ED8"
        />
      </Pressable>
    </View>
  </View>
);

export const PracticeQuickGuideSheet = ({
  visible,
  title,
  subtitle,
  closeLabel,
  fullGuideLabel,
  bestPattern,
  steps,
  onClose,
  onOpenFullGuide,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  closeLabel: string;
  fullGuideLabel: string;
  bestPattern: string;
  steps: GuideStep[];
  onClose: () => void;
  onOpenFullGuide: () => void;
}) => (
  <BottomSheet
    visible={visible}
    title={title}
    subtitle={subtitle}
    onClose={onClose}
    footer={
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
          onPress={onClose}
        >
          <Text style={styles.ghostButtonLabel}>{closeLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={onOpenFullGuide}
        >
          <Text style={styles.primaryButtonLabel}>{fullGuideLabel}</Text>
        </Pressable>
      </View>
    }
  >
    <ScrollView
      style={styles.sheetScroll}
      contentContainerStyle={styles.sheetScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {steps.map((step, index) => (
        <View key={`guide-${step.title}`} style={styles.helpSheetStepRow}>
          <View style={[styles.helpSheetNumber, { backgroundColor: step.accentSoft }]}>
            <Text style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.helpSheetStepTextWrap}>
            <View style={styles.helpSheetStepHeader}>
              <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
              <Text style={styles.helpSheetStepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.helpStepHint}>{step.hint}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.metaText}>{bestPattern}</Text>
    </ScrollView>
  </BottomSheet>
);

export const PracticeOnboardingSheet = ({
  visible,
  title,
  subtitle,
  skipLabel,
  showGuideLabel,
  eyebrow,
  heroTitle,
  body,
  hintTitle,
  hint,
  steps,
  onClose,
  onSkip,
  onShowGuide,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  skipLabel: string;
  showGuideLabel: string;
  eyebrow: string;
  heroTitle: string;
  body: string;
  hintTitle: string;
  hint: string;
  steps: GuideStep[];
  onClose: () => void;
  onSkip: () => void;
  onShowGuide: () => void;
}) => (
  <BottomSheet
    visible={visible}
    title={title}
    subtitle={subtitle}
    onClose={onClose}
    footer={
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
          onPress={onSkip}
        >
          <Text style={styles.ghostButtonLabel}>{skipLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={onShowGuide}
        >
          <Text style={styles.primaryButtonLabel}>{showGuideLabel}</Text>
        </Pressable>
      </View>
    }
  >
    <ScrollView
      style={styles.sheetScroll}
      contentContainerStyle={styles.sheetScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.onboardingHeroCard}>
        <Text style={styles.onboardingHeroEyebrow}>{eyebrow}</Text>
        <Text style={styles.onboardingHeroTitle}>{heroTitle}</Text>
        <Text style={styles.helpStepHint}>{body}</Text>
      </View>

      {steps.map((step, index) => (
        <View key={`onboarding-${step.title}`} style={styles.helpSheetStepRow}>
          <View style={[styles.helpSheetNumber, { backgroundColor: step.accentSoft }]}>
            <Text style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.helpSheetStepTextWrap}>
            <View style={styles.helpSheetStepHeader}>
              <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
              <Text style={styles.helpSheetStepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.helpStepHint}>{step.hint}</Text>
          </View>
        </View>
      ))}

      <MiniHelpHint title={hintTitle} hint={hint} />
    </ScrollView>
  </BottomSheet>
);

export const PracticeBuilderSection = ({
  title,
  mixTitle,
  mixHint,
  mixTotalLabel,
  scopeItems,
  onScopePress,
  mixItems,
  presetTitle,
  presetResetLabel,
  onResetPresets,
  presets,
  mixSummaryTitle,
  configuredMixCount,
  activeMixTypes,
  questionsLabel,
  typesLabel,
  readyCopy,
  fallbackCopy,
  tooLargeError,
  unavailableError,
  isLoadingWorkspace,
  loadingWorkspaceLabel,
  workspaceErrorMessage,
}: {
  title: string;
  mixTitle: string;
  mixHint: string;
  mixTotalLabel: string;
  scopeItems: Array<{ key: ScopePickerKey; label: string; value: string }>;
  onScopePress: (key: ScopePickerKey) => void;
  mixItems: Array<{
    key: PracticeQuestionType;
    label: string;
    helper: string;
    value: string;
    availableCount?: number;
    onChange: (value: string) => void;
  }>;
  presetTitle: string;
  presetResetLabel: string;
  onResetPresets: () => void;
  presets: Array<{ key: string; label: string; onPress: () => void }>;
  mixSummaryTitle: string;
  configuredMixCount: number;
  activeMixTypes: number;
  questionsLabel: string;
  typesLabel: string;
  readyCopy: string;
  fallbackCopy: string;
  tooLargeError?: string | null;
  unavailableError?: string | null;
  isLoadingWorkspace: boolean;
  loadingWorkspaceLabel: string;
  workspaceErrorMessage?: string | null;
}) => (
  <View style={styles.card}>
    <View style={styles.scopeHeaderRow}>
      <View style={styles.scopeHeaderTextWrap}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>

    <ScopeSummaryGrid items={scopeItems} onPress={(key) => onScopePress(key as ScopePickerKey)} />

    <QuestionMixBuilder
      title={mixTitle}
      hint={mixHint}
      totalLabel={mixTotalLabel}
      items={mixItems}
    />

    <View style={styles.mixPresetBlock}>
      <View style={styles.mixPresetHeader}>
        <Text style={styles.filterTitle}>{presetTitle}</Text>
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
          onPress={onResetPresets}
        >
          <Text style={styles.linkButtonLabel}>{presetResetLabel}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mixPresetRow}>
        {presets.map((preset) => (
          <Pressable
            key={preset.key}
            style={({ pressed }) => [styles.mixPresetChip, pressed && styles.buttonPressed]}
            onPress={preset.onPress}
          >
            <Text style={styles.mixPresetChipLabel}>{preset.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>

    <View style={styles.mixSummaryCard}>
      <Text style={styles.cardTitle}>{mixSummaryTitle}</Text>
      <View style={styles.mixSummaryRow}>
        <View style={styles.mixMetric}>
          <Text style={styles.mixMetricValue}>{configuredMixCount}</Text>
          <Text style={styles.mixMetricLabel}>{questionsLabel}</Text>
        </View>
        <View style={styles.mixMetric}>
          <Text style={styles.mixMetricValue}>{activeMixTypes}</Text>
          <Text style={styles.mixMetricLabel}>{typesLabel}</Text>
        </View>
        <View style={styles.mixMetricWide}>
          <Text style={styles.mixMetricCopy}>
            {configuredMixCount > 0 ? readyCopy : fallbackCopy}
          </Text>
        </View>
      </View>
      {tooLargeError ? <InlineErrorState message={tooLargeError} /> : null}
      {unavailableError ? <InlineErrorState message={unavailableError} /> : null}
    </View>

    {isLoadingWorkspace ? <InlineLoadingState label={loadingWorkspaceLabel} /> : null}
    {workspaceErrorMessage ? <InlineErrorState message={workspaceErrorMessage} /> : null}
  </View>
);

export const RecentPracticeSessionsSection = ({
  title,
  viewAllLabel,
  onViewAll,
  deleteActionLabel,
  deletingLabel,
  loadingLabel,
  errorMessage,
  emptyTitle,
  emptyHint,
  rows,
  scoreMeta,
  startedMetaLabel,
  toStatusLabel,
  deletingSessionId,
  onDeleteSession,
}: {
  title: string;
  viewAllLabel: string;
  onViewAll: () => void;
  deleteActionLabel: string;
  deletingLabel: string;
  loadingLabel: string;
  errorMessage?: string | null;
  emptyTitle: string;
  emptyHint: string;
  rows: PracticeSessionListRow[];
  scoreMeta: (scorePercent: number | null, count: number) => string;
  startedMetaLabel: (value: string) => string;
  toStatusLabel: (status: PracticeSessionStatus) => string;
  deletingSessionId?: string | null;
  onDeleteSession: (sessionId: string) => void;
}) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.recentHeadingRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
          onPress={onViewAll}
        >
          <Text style={styles.linkButtonLabel}>{viewAllLabel}</Text>
        </Pressable>
      </View>

      {loadingLabel ? <CardListSkeleton count={3} /> : null}
      {errorMessage ? <InlineErrorState message={errorMessage} /> : null}

      {!loadingLabel && !errorMessage && rows.length === 0 ? (
        <EmptyStateCard title={emptyTitle} hint={emptyHint} />
      ) : null}

      {rows.map((session) => (
        <Pressable
          key={session.id}
          style={({ pressed }) => [styles.sessionCard, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
        >
          <View style={styles.sessionHeadingRow}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <View style={styles.sessionHeaderActions}>
              <Text
                style={[
                  styles.sessionStatus,
                  session.status === "completed" ? styles.sessionStatusDone : styles.sessionStatusLive,
                ]}
              >
                {toStatusLabel(session.status)}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={deletingSessionId === session.id}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.sessionDeleteButton,
                  pressed && styles.buttonPressed,
                  deletingSessionId === session.id && styles.buttonDisabled,
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                <Text style={styles.sessionDeleteLabel}>
                  {deletingSessionId === session.id ? deletingLabel : deleteActionLabel}
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.sessionMeta}>{scoreMeta(session.scorePercent, session.totalQuestions)}</Text>
          <Text style={styles.sessionMeta}>{startedMetaLabel(session.startedAt)}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export const PracticeStartSection = ({
  title,
  errorMessage,
  actionLabel,
  actionDisabled,
  onStart,
}: {
  title: string;
  errorMessage?: string | null;
  actionLabel: string;
  actionDisabled: boolean;
  onStart: () => void;
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {errorMessage ? <InlineErrorState message={errorMessage} /> : null}
    <View style={styles.buttonColumn}>
      <Pressable
        disabled={actionDisabled}
        style={({ pressed }) => [
          styles.secondaryButton,
          actionDisabled && styles.buttonDisabled,
          pressed && !actionDisabled && styles.buttonPressed,
        ]}
        onPress={onStart}
      >
        <Text style={styles.secondaryButtonLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  headerBlock: {
    gap: 4,
    marginTop: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heading: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
  },
  helpIconButton: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "700",
  },
  scopeHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scopeHeaderTextWrap: {
    flex: 1,
  },
  mixPresetBlock: {
    gap: 8,
  },
  mixPresetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  mixPresetRow: {
    gap: 8,
  },
  mixPresetChip: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mixPresetChipLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  mixSummaryCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  mixSummaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  mixMetric: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  mixMetricWide: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    justifyContent: "center",
    padding: 10,
  },
  mixMetricValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  mixMetricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  mixMetricCopy: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  ghostButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  ghostButtonLabel: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonColumn: {
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetScrollContent: {
    gap: 14,
    paddingBottom: 4,
  },
  helpSheetStepRow: {
    flexDirection: "row",
    gap: 12,
  },
  helpSheetNumber: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  helpSheetNumberLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  helpSheetStepTextWrap: {
    flex: 1,
    gap: 4,
  },
  helpSheetStepHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  helpSheetStepTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  helpStepHint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  onboardingHeroCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  onboardingHeroEyebrow: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  onboardingHeroTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  recentHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkButton: {
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkButtonLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  sessionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  sessionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionHeaderActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sessionTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    paddingRight: 8,
  },
  sessionStatus: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: "capitalize",
  },
  sessionStatusLive: {
    backgroundColor: "#E0EAFF",
    color: "#1D4ED8",
  },
  sessionStatusDone: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  sessionDeleteButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    paddingHorizontal: 10,
  },
  sessionDeleteLabel: {
    color: "#BE123C",
    fontSize: 11,
    fontWeight: "700",
  },
  sessionMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
