import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { QuestionMixBuilder } from "@/components/ui/question-mix-builder";
import { ScopeSummaryGrid } from "@/components/ui/scope-summary-grid";
import {
  CardListSkeleton,
  EmptyStateCard,
  InlineErrorState,
  InlineLoadingState,
} from "@/components/ui/state-blocks";
import type {
  ExportedQuestionPaperSummary,
  PaperQuestionType,
  QuestionPaperSummary,
} from "../types/papers.types";

type ScopePickerKey = "grade" | "subject" | "chapter" | "lesson";
type GuideStep = {
  title: string;
  hint: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
};

export const PapersHomeHeader = ({
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
          name={{ ios: "questionmark.circle.fill", android: "help", web: "help" }}
          size={18}
          tintColor="#1D4ED8"
        />
      </Pressable>
    </View>
  </View>
);

export const PapersQuickGuideSheet = ({
  visible,
  title,
  subtitle,
  closeLabel,
  fullGuideLabel,
  steps,
  onClose,
  onOpenFullGuide,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  closeLabel: string;
  fullGuideLabel: string;
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
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onClose}
        >
          <Text style={styles.secondaryButtonLabel}>{closeLabel}</Text>
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
        <View key={`paper-guide-${step.title}`} style={styles.helpStepRow}>
          <View style={[styles.helpStepNumber, { backgroundColor: step.accentSoft }]}>
            <Text style={[styles.helpStepNumberLabel, { color: step.accentColor }]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.helpStepTextWrap}>
            <View style={styles.helpStepHeader}>
              <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
              <Text style={styles.helpStepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.helpStepHint}>{step.hint}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  </BottomSheet>
);

export const PaperSetupSection = ({
  title,
  paperTitleLabel,
  paperTitle,
  paperTitlePlaceholder,
  onTitleChange,
  loadingLabel,
  errorMessage,
  includeAnswerKeyLabel,
  includeAnswerKey,
  onToggleAnswerKey,
  gradeLabel,
  selectedGrade,
  gradeHint,
  selectGradeLabel,
  onSelectGrade,
  templatesLabel,
  onOpenTemplates,
}: {
  title: string;
  paperTitleLabel: string;
  paperTitle: string;
  paperTitlePlaceholder: string;
  onTitleChange: (value: string) => void;
  loadingLabel?: string | null;
  errorMessage?: string | null;
  includeAnswerKeyLabel: string;
  includeAnswerKey: boolean;
  onToggleAnswerKey: () => void;
  gradeLabel: string;
  selectedGrade?: string | null;
  gradeHint: string;
  selectGradeLabel: string;
  onSelectGrade: () => void;
  templatesLabel: string;
  onOpenTemplates: () => void;
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>

    <View style={styles.formGroup}>
      <Text style={styles.label}>{paperTitleLabel}</Text>
      <TextInput
        placeholder={paperTitlePlaceholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={paperTitle}
        onChangeText={onTitleChange}
      />
    </View>

    {loadingLabel ? <InlineLoadingState label={loadingLabel} /> : null}
    {errorMessage ? <InlineErrorState message={errorMessage} /> : null}

    <View style={styles.requiredScopeCard}>
      <View style={styles.requiredScopeCopy}>
        <Text style={styles.label}>{gradeLabel}</Text>
        <Text style={styles.requiredScopeHint}>
          {selectedGrade ?? gradeHint}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
        onPress={onSelectGrade}
      >
        <Text style={styles.linkButtonLabel}>{selectGradeLabel}</Text>
      </Pressable>
    </View>

    <Pressable
      style={({ pressed }) => [
        styles.checkboxRow,
        includeAnswerKey && styles.checkboxRowActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onToggleAnswerKey}
    >
      <Text style={styles.checkboxLabel}>
        {includeAnswerKey ? "✓ " : ""}
        {includeAnswerKeyLabel}
      </Text>
    </Pressable>

    <Pressable
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      onPress={onOpenTemplates}
    >
      <Text style={styles.secondaryButtonLabel}>{templatesLabel}</Text>
    </Pressable>
  </View>
);

export const PaperBuilderSection = ({
  title,
  collapsedHint,
  expandLabel,
  collapseLabel,
  isExpanded,
  onToggleExpanded,
  scopeTitle,
  clearLabel,
  onClear,
  scopeItems,
  onScopePress,
  mixTitle,
  mixHint,
  mixTotalLabel,
  mixItems,
  showCount,
  countLabel,
  countValue,
  countPlaceholder,
  onCountChange,
  errorMessage,
  actionLabel,
  actionDisabled,
  onSubmit,
}: {
  title: string;
  collapsedHint: string;
  expandLabel: string;
  collapseLabel: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  scopeTitle: string;
  clearLabel: string;
  onClear: () => void;
  scopeItems: Array<{ key: ScopePickerKey; label: string; value: string }>;
  onScopePress: (key: ScopePickerKey) => void;
  mixTitle: string;
  mixHint: string;
  mixTotalLabel: string;
  mixItems: Array<{
    key: PaperQuestionType;
    label: string;
    helper: string;
    value: string;
    availableCount?: number;
    onChange: (value: string) => void;
  }>;
  showCount: boolean;
  countLabel: string;
  countValue: string;
  countPlaceholder: string;
  onCountChange: (value: string) => void;
  errorMessage?: string | null;
  actionLabel: string;
  actionDisabled: boolean;
  onSubmit: () => void;
}) => (
  <View style={styles.card}>
    <View style={styles.scopeHeaderRow}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
        onPress={onToggleExpanded}
      >
        <Text style={styles.linkButtonLabel}>{isExpanded ? collapseLabel : expandLabel}</Text>
      </Pressable>
    </View>

    {!isExpanded ? <Text style={styles.builderCollapsedHint}>{collapsedHint}</Text> : null}

    {isExpanded ? (
      <>

        <View style={styles.scopeHeaderRow}>
          <Text style={styles.label}>{scopeTitle}</Text>
          <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]} onPress={onClear}>
            <Text style={styles.linkButtonLabel}>{clearLabel}</Text>
          </Pressable>
        </View>

        <ScopeSummaryGrid items={scopeItems} onPress={(key) => onScopePress(key as ScopePickerKey)} />

        <QuestionMixBuilder
          title={mixTitle}
          hint={mixHint}
          totalLabel={mixTotalLabel}
          items={mixItems}
        />

        {showCount ? (
          <View style={styles.countRow}>
            <Text style={styles.label}>{countLabel}</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder={countPlaceholder}
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.countInput]}
              value={countValue}
              onChangeText={onCountChange}
            />
          </View>
        ) : null}
      </>
    ) : null}

    {errorMessage ? <InlineErrorState message={errorMessage} /> : null}
    <Pressable
      disabled={actionDisabled}
      style={({ pressed }) => [
        styles.primaryButton,
        actionDisabled && styles.buttonDisabled,
        pressed && !actionDisabled && styles.buttonPressed,
      ]}
      onPress={onSubmit}
    >
      <Text style={styles.primaryButtonLabel}>{actionLabel}</Text>
    </Pressable>
  </View>
);

export const SavedPapersSection = ({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  loadingLabel,
  errorMessage,
  showEmptyState,
  emptyTitle,
  emptyHint,
  showNoMatchesState,
  noMatchesTitle,
  noMatchesHint,
  rows,
  formatUpdated,
  toStatusLabel,
}: {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: Array<{ value: string; label: string }>;
  activeFilter: string;
  onFilterChange: (value: string) => void;
  loadingLabel?: string | null;
  errorMessage?: string | null;
  showEmptyState: boolean;
  emptyTitle: string;
  emptyHint: string;
  showNoMatchesState: boolean;
  noMatchesTitle: string;
  noMatchesHint: string;
  rows: QuestionPaperSummary[];
  formatUpdated: (value: string) => string;
  toStatusLabel: (status: "draft" | "finalized", exportedAt: string | null) => string;
}) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.savedFiltersBlock}>
        <TextInput
          placeholder={searchPlaceholder}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={searchValue}
          onChangeText={onSearchChange}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedFilterChipsRow}>
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => onFilterChange(filter.value)}
              >
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loadingLabel ? <CardListSkeleton count={3} /> : null}
      {errorMessage ? <InlineErrorState message={errorMessage} /> : null}
      {showEmptyState ? (
        <EmptyStateCard title={emptyTitle} hint={emptyHint} />
      ) : null}

      {rows.map((paper) => (
        <Pressable
          key={paper.id}
          style={({ pressed }) => [styles.paperCard, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
        >
          <View style={styles.paperHeadingRow}>
            <Text style={styles.paperTitle}>{paper.title}</Text>
            <Text style={styles.statusPill}>{toStatusLabel(paper.status, paper.exportedAt)}</Text>
          </View>
          <Text style={styles.paperMeta}>
            {paper.totalQuestions} questions • {paper.totalMarks} marks
          </Text>
          <Text style={styles.paperMeta}>{formatUpdated(paper.updatedAt)}</Text>
        </Pressable>
      ))}

      {showNoMatchesState ? (
        <EmptyStateCard title={noMatchesTitle} hint={noMatchesHint} />
      ) : null}
    </View>
  );
};

export const RecentExportsSection = ({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  loadingLabel,
  errorMessage,
  showEmptyState,
  emptyTitle,
  emptyHint,
  showNoMatchesState,
  noMatchesTitle,
  noMatchesHint,
  rows,
  formatExportedAt,
  exportedLabel,
}: {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  loadingLabel?: string | null;
  errorMessage?: string | null;
  showEmptyState: boolean;
  emptyTitle: string;
  emptyHint: string;
  showNoMatchesState: boolean;
  noMatchesTitle: string;
  noMatchesHint: string;
  rows: ExportedQuestionPaperSummary[];
  formatExportedAt: (value: string | null) => string;
  exportedLabel: string;
}) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <TextInput
        placeholder={searchPlaceholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={searchValue}
        onChangeText={onSearchChange}
      />

      {loadingLabel ? <CardListSkeleton count={2} /> : null}
      {errorMessage ? <InlineErrorState message={errorMessage} /> : null}
      {showEmptyState ? (
        <EmptyStateCard title={emptyTitle} hint={emptyHint} />
      ) : null}

      {rows.map((paper) => (
        <Pressable
          key={paper.id}
          style={({ pressed }) => [styles.paperCard, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
        >
          <View style={styles.paperHeadingRow}>
            <Text style={styles.paperTitle}>{paper.title}</Text>
            <Text style={[styles.statusPill, styles.exportedPill]}>{exportedLabel}</Text>
          </View>
          <Text style={styles.paperMeta}>
            {paper.totalQuestions} questions • {paper.totalMarks} marks
          </Text>
          <Text style={styles.paperMeta}>{formatExportedAt(paper.exportedAt)}</Text>
        </Pressable>
      ))}

      {showNoMatchesState ? (
        <EmptyStateCard title={noMatchesTitle} hint={noMatchesHint} />
      ) : null}
    </View>
  );
};

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
  formGroup: {
    gap: 6,
  },
  label: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkboxRow: {
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkboxRowActive: {
    backgroundColor: "#E0EAFF",
    borderColor: "#4F7DF3",
  },
  checkboxLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
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
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  scopeHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  requiredScopeCard: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12,
  },
  requiredScopeCopy: {
    flex: 1,
    gap: 2,
  },
  requiredScopeHint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  builderCollapsedHint: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
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
  countRow: {
    gap: 6,
  },
  countInput: {
    maxWidth: 140,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetScrollContent: {
    gap: 14,
    paddingBottom: 4,
  },
  helpStepRow: {
    flexDirection: "row",
    gap: 12,
  },
  helpStepNumber: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  helpStepNumberLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  helpStepTextWrap: {
    flex: 1,
    gap: 4,
  },
  helpStepHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  helpStepTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  helpStepHint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  savedFiltersBlock: {
    gap: 10,
  },
  savedFilterChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#E0EAFF",
    borderColor: "#4F7DF3",
  },
  filterChipLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipLabelActive: {
    color: "#1D4ED8",
  },
  paperCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  paperHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paperTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "76%",
  },
  statusPill: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: "capitalize",
  },
  exportedPill: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
  },
  paperMeta: {
    color: "#64748B",
    fontSize: 12,
  },
});
