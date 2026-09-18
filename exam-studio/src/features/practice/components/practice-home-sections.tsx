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
        style={({ pressed }) => [
          styles.helpIconButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onOpenHelp}
      >
        <SymbolView
          name={{
            ios: "questionmark.circle.fill",
            android: "help",
            web: "help",
          }}
          size={18}
          tintColor="#48766B"
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
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.ghostButtonLabel}>{closeLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
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
          <View
            style={[
              styles.helpSheetNumber,
              { backgroundColor: step.accentSoft },
            ]}
          >
            <Text
              style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}
            >
              {index + 1}
            </Text>
          </View>
          <View style={styles.helpSheetStepTextWrap}>
            <View style={styles.helpSheetStepHeader}>
              <SymbolView
                name={step.icon}
                size={16}
                tintColor={step.accentColor}
              />
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
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onSkip}
        >
          <Text style={styles.ghostButtonLabel}>{skipLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
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
          <View
            style={[
              styles.helpSheetNumber,
              { backgroundColor: step.accentSoft },
            ]}
          >
            <Text
              style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}
            >
              {index + 1}
            </Text>
          </View>
          <View style={styles.helpSheetStepTextWrap}>
            <View style={styles.helpSheetStepHeader}>
              <SymbolView
                name={step.icon}
                size={16}
                tintColor={step.accentColor}
              />
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
  collapsedHint,
  expandLabel,
  collapseLabel,
  isExpanded,
  onToggleExpanded,
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
  collapsedHint: string;
  expandLabel: string;
  collapseLabel: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={({ pressed }) => [
          styles.linkButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onToggleExpanded}
      >
        <Text style={styles.linkButtonLabel}>
          {isExpanded ? collapseLabel : expandLabel}
        </Text>
      </Pressable>
    </View>

    {!isExpanded ? (
      <Text style={styles.builderCollapsedHint}>{collapsedHint}</Text>
    ) : null}

    {isExpanded ? (
      <>
        <ScopeSummaryGrid
          items={scopeItems}
          onPress={key => onScopePress(key as ScopePickerKey)}
        />

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
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onResetPresets}
            >
              <Text style={styles.linkButtonLabel}>{presetResetLabel}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mixPresetRow}
          >
            {presets.map(preset => (
              <Pressable
                key={preset.key}
                style={({ pressed }) => [
                  styles.mixPresetChip,
                  pressed && styles.buttonPressed,
                ]}
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
          {unavailableError ? (
            <InlineErrorState message={unavailableError} />
          ) : null}
        </View>

        {isLoadingWorkspace ? (
          <InlineLoadingState label={loadingWorkspaceLabel} />
        ) : null}
        {workspaceErrorMessage ? (
          <InlineErrorState message={workspaceErrorMessage} />
        ) : null}
      </>
    ) : null}
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
          style={({ pressed }) => [
            styles.linkButton,
            pressed && styles.buttonPressed,
          ]}
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

      {rows.map(session => (
        <Pressable
          key={session.id}
          style={({ pressed }) => [
            styles.sessionCard,
            pressed && styles.buttonPressed,
          ]}
          onPress={() =>
            router.push(`/practice/${session.id}` as RelativePathString)
          }
        >
          <View style={styles.sessionHeadingRow}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <View style={styles.sessionHeaderActions}>
              <Text
                style={[
                  styles.sessionStatus,
                  session.status === "completed"
                    ? styles.sessionStatusDone
                    : styles.sessionStatusLive,
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
                onPress={event => {
                  event.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                <Text style={styles.sessionDeleteLabel}>
                  {deletingSessionId === session.id
                    ? deletingLabel
                    : deleteActionLabel}
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.sessionMeta}>
            {scoreMeta(session.scorePercent, session.totalQuestions)}
          </Text>
          <Text style={styles.sessionMeta}>
            {startedMetaLabel(session.startedAt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export const PracticeStartSection = ({
  title,
  scopeTitle,
  scopeItems,
  onScopePress,
  modeTitle,
  modeItems,
  errorMessage,
  actionLabel,
  actionDisabled,
  needsGrade,
  gradeHint,
  onStart,
}: {
  title: string;
  scopeTitle: string;
  scopeItems: Array<{ key: ScopePickerKey; label: string; value: string }>;
  onScopePress: (key: ScopePickerKey) => void;
  modeTitle: string;
  modeItems: Array<{ key: string; label: string; onPress: () => void }>;
  errorMessage?: string | null;
  actionLabel: string;
  actionDisabled: boolean;
  needsGrade: boolean;
  gradeHint: string;
  onStart: () => void;
}) => (
  <View style={[styles.card, styles.startCard]}>
    <View style={styles.startTitleRow}>
      <View style={styles.startIcon}>
        <SymbolView
          name={{ ios: "sparkles", android: "auto-awesome", web: "auto-awesome" }}
          size={18}
          tintColor="#48766B"
        />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.startSetupBlock}>
      <Text style={styles.startSetupLabel}>{scopeTitle}</Text>
      <View style={styles.startScopeRow}>
        {scopeItems.map(item => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.startScopeChip,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => onScopePress(item.key)}
          >
            <Text style={styles.startScopeLabel}>{item.label}</Text>
            <Text numberOfLines={1} style={styles.startScopeValue}>
              {item.value}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
    <View style={styles.startSetupBlock}>
      <Text style={styles.startSetupLabel}>{modeTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.startModeRow}
      >
        {modeItems.map(item => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.startModeChip,
              pressed && styles.buttonPressed,
            ]}
            onPress={item.onPress}
          >
            <Text style={styles.startModeLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
    {needsGrade ? (
      <View style={styles.startRequirementCard}>
        <Text style={styles.startRequirementText}>{gradeHint}</Text>
      </View>
    ) : null}
    {errorMessage ? <InlineErrorState message={errorMessage} /> : null}
    <View style={styles.buttonColumn}>
      <Pressable
        disabled={actionDisabled}
        style={({ pressed }) => [
          styles.primaryButton,
          actionDisabled && styles.buttonDisabled,
          pressed && !actionDisabled && styles.buttonPressed,
        ]}
        onPress={onStart}
      >
        <Text style={styles.primaryButtonLabel}>{actionLabel}</Text>
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
    color: "#202321",
    fontSize: 28,
    fontWeight: "800",
  },
  helpIconButton: {
    alignItems: "center",
    backgroundColor: "#E7EFE9",
    borderColor: "#A8C9BD",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    gap: 12,
    padding: 16,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  startCard: {
    backgroundColor: "#F4F8F4",
    borderColor: "#BBD5C9",
    shadowOpacity: 0.1,
  },
  startTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  startIcon: {
    alignItems: "center",
    backgroundColor: "#E1EFE8",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  cardTitle: {
    color: "#202321",
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
  builderCollapsedHint: {
    color: "#6E706B",
    fontSize: 14,
    lineHeight: 20,
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
    color: "#4F514B",
    fontSize: 12,
    fontWeight: "700",
  },
  mixPresetRow: {
    gap: 8,
  },
  mixPresetChip: {
    backgroundColor: "#E7EFE9",
    borderColor: "#A8C9BD",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mixPresetChipLabel: {
    color: "#48766B",
    fontSize: 12,
    fontWeight: "700",
  },
  mixSummaryCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
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
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  mixMetricWide: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    justifyContent: "center",
    padding: 10,
  },
  mixMetricValue: {
    color: "#202321",
    fontSize: 18,
    fontWeight: "800",
  },
  mixMetricLabel: {
    color: "#6E706B",
    fontSize: 11,
    fontWeight: "600",
  },
  mixMetricCopy: {
    color: "#4F514B",
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
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  ghostButtonLabel: {
    color: "#202321",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#48766B",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButtonLabel: {
    color: "#FFFDF8",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CFC9BD",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  secondaryButtonLabel: {
    color: "#4F514B",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonColumn: {
    gap: 8,
  },
  startSetupBlock: {
    gap: 8,
  },
  startSetupLabel: {
    color: "#4F514B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  startScopeRow: {
    flexDirection: "row",
    gap: 8,
  },
  startScopeChip: {
    backgroundColor: "#FFFDF8",
    borderColor: "#C8DED2",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  startScopeLabel: {
    color: "#6E706B",
    fontSize: 11,
    fontWeight: "700",
  },
  startScopeValue: {
    color: "#202321",
    fontSize: 14,
    fontWeight: "700",
  },
  startModeRow: {
    gap: 8,
  },
  startModeChip: {
    backgroundColor: "#E1EFE8",
    borderColor: "#BBD5C9",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  startModeLabel: {
    color: "#48766B",
    fontSize: 12,
    fontWeight: "800",
  },
  startRequirementCard: {
    backgroundColor: "#E7EFE9",
    borderColor: "#A8C9BD",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  startRequirementText: {
    color: "#48766B",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
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
    color: "#202321",
    fontSize: 14,
    fontWeight: "700",
  },
  helpStepHint: {
    color: "#6E706B",
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    color: "#6E706B",
    fontSize: 12,
    lineHeight: 18,
  },
  onboardingHeroCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  onboardingHeroEyebrow: {
    color: "#48766B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  onboardingHeroTitle: {
    color: "#202321",
    fontSize: 18,
    fontWeight: "800",
  },
  recentHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkButton: {
    borderColor: "#CFC9BD",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkButtonLabel: {
    color: "#4F514B",
    fontSize: 12,
    fontWeight: "700",
  },
  sessionCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 1,
    gap: 5,
    padding: 12,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
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
    color: "#202321",
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
    backgroundColor: "#F5E4DA",
    color: "#48766B",
  },
  sessionStatusDone: {
    backgroundColor: "#E7EFE9",
    color: "#48766B",
  },
  sessionDeleteButton: {
    alignItems: "center",
    backgroundColor: "#F5E4DA",
    borderColor: "#EAD1C3",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    paddingHorizontal: 10,
  },
  sessionDeleteLabel: {
    color: "#AD5948",
    fontSize: 11,
    fontWeight: "700",
  },
  sessionMeta: {
    color: "#6E706B",
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
