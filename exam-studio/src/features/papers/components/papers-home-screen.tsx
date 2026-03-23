import { SymbolView } from "expo-symbols";
import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MathRichText } from "@/components/ui/math-rich-text";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FilterSummaryBar } from "@/components/ui/filter-summary-bar";
import { MiniHelpHint } from "@/components/ui/mini-help-hint";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useTranslation } from "@/i18n";
import { useWorkspaceCatalogQuery } from "@/features/practice/hooks/use-workspace-catalog-query";
import { useQuickTypeCountsQuery } from "@/features/practice/hooks/use-quick-type-counts-query";
import type { CatalogQuestion } from "@/features/practice/types/practice.types";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useWorkspaceMetaQuery } from "@/features/workspace/hooks/use-workspace-meta-query";
import { useCreateQuestionPaperMutation } from "../hooks/use-create-question-paper-mutation";
import { useExportedQuestionPapersQuery } from "../hooks/use-exported-question-papers-query";
import { useQuestionPapersQuery } from "../hooks/use-question-papers-query";
import type { PaperQuestionType } from "../types/papers.types";

type QuestionTypeFilter = PaperQuestionType | "all";
type FilterValue = string | "all";
type ActiveFilterChip = {
  key: string;
  label: string;
};

type QuickTypeFilter = {
  value: QuestionTypeFilter;
  labelKey: string;
  shortLabelKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
};

const QUESTION_TYPE_FILTERS: Array<{ value: QuestionTypeFilter; labelKey: string }> = [
  { value: "all", labelKey: "papers:questionTypes.all" },
  { value: "mcq", labelKey: "papers:questionTypes.mcq" },
  { value: "true_false", labelKey: "papers:questionTypes.trueFalse" },
  { value: "short_answer", labelKey: "papers:questionTypes.short" },
  { value: "long_answer", labelKey: "papers:questionTypes.long" },
  { value: "fill_blank", labelKey: "papers:questionTypes.fillBlank" },
  { value: "matching", labelKey: "papers:questionTypes.matching" },
];

const QUICK_TYPE_FILTERS: QuickTypeFilter[] = [
  {
    value: "all",
    labelKey: "papers:questionTypes.allTypes",
    shortLabelKey: "papers:questionTypes.all",
    icon: { ios: "square.grid.2x2.fill", android: "grid_view", web: "grid_view" },
    accentColor: "#475569",
    accentSoft: "#E2E8F0",
  },
  {
    value: "mcq",
    labelKey: "papers:questionTypes.mcq",
    shortLabelKey: "papers:questionTypes.mcq",
    icon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    value: "true_false",
    labelKey: "papers:questionTypes.trueFalse",
    shortLabelKey: "papers:questionTypes.tfShort",
    icon: { ios: "checkmark.seal.fill", android: "fact_check", web: "fact_check" },
    accentColor: "#047857",
    accentSoft: "#D1FAE5",
  },
];

const PAPER_GUIDE_STEPS: Array<{
  titleKey: string;
  hintKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
}> = [
  {
    titleKey: "papers:home.guidePickTitle",
    hintKey: "papers:home.guidePickHint",
    icon: { ios: "checklist", android: "checklist", web: "checklist" },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    titleKey: "papers:home.guideReviewTitle",
    hintKey: "papers:home.guideReviewHint",
    icon: { ios: "list.bullet.rectangle.portrait", android: "view_list", web: "view_list" },
    accentColor: "#047857",
    accentSoft: "#DCFCE7",
  },
  {
    titleKey: "papers:home.guideCreateTitle",
    hintKey: "papers:home.guideCreateHint",
    icon: { ios: "doc.badge.plus", android: "note_add", web: "note_add" },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
  },
  {
    titleKey: "papers:home.guideFinalizeTitle",
    hintKey: "papers:home.guideFinalizeHint",
    icon: { ios: "arrow.up.doc.fill", android: "ios_share", web: "ios_share" },
    accentColor: "#7C3AED",
    accentSoft: "#EDE9FE",
  },
];

const toStatusLabel = (status: "draft" | "finalized", exportedAt: string | null) => {
  if (exportedAt) return "papers:status.exported";
  return status;
};

const toQuestionTypeLabelKey = (value: PaperQuestionType) => {
  if (value === "mcq") return "papers:questionTypes.mcq";
  if (value === "true_false") return "papers:questionTypes.trueFalse";
  if (value === "short_answer") return "papers:questionTypes.shortAnswer";
  if (value === "long_answer") return "papers:questionTypes.longAnswer";
  if (value === "fill_blank") return "papers:questionTypes.fillBlank";
  if (value === "matching") return "papers:questionTypes.matching";
  return value;
};

const toQuestionPreviewBody = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157).trimEnd()}...`;
};

const SelectedQuestionChip = ({
  question,
  onRemove,
}: {
  question: CatalogQuestion;
  onRemove: (questionId: string) => void;
}) => (
  // Translation is local here so selected chips update immediately when language changes.
  <Pressable
    style={({ pressed }) => [styles.selectedChip, pressed && styles.buttonPressed]}
    onPress={() => onRemove(question.id)}
  >
    <Text style={styles.selectedChipLabel}>{question.questionCode}</Text>
    <SelectedQuestionChipRemoveLabel />
  </Pressable>
);

const SelectedQuestionChipRemoveLabel = () => {
  const { t } = useTranslation("papers");
  return <Text style={styles.selectedChipRemove}>{t("home.remove")}</Text>;
};

const QuestionCatalogCard = ({
  question,
  isSelected,
  onToggle,
}: {
  question: CatalogQuestion;
  isSelected: boolean;
  onToggle: (question: CatalogQuestion) => void;
}) => (
  // Card-local translation keeps the parent list wiring simple.
  <Pressable
    style={({ pressed }) => [
      styles.catalogCard,
      isSelected && styles.catalogCardSelected,
      pressed && styles.buttonPressed,
    ]}
    onPress={() => onToggle(question)}
  >
    <View style={styles.catalogCardTopRow}>
      <View style={styles.catalogCardTitleWrap}>
        <Text style={styles.catalogQuestionCode}>{question.questionCode}</Text>
        <Text style={styles.catalogQuestionMeta}>
          <QuestionCatalogMeta type={question.type} marks={question.marks} />
        </Text>
      </View>
      <QuestionCatalogBadge isSelected={isSelected} />
    </View>

    <MathRichText
      content={toQuestionPreviewBody(question.bodyPreview)}
      renderMode="native"
      textStyle={styles.catalogQuestionBody}
    />

    <Text style={styles.catalogQuestionMetaSecondary}>
      {question.grade.name} • {question.subject.name}
      {question.chapter ? ` • ${question.chapter.name}` : ""}
      {question.subChapter ? ` • ${question.subChapter.name}` : ""}
    </Text>
  </Pressable>
);

const QuestionCatalogMeta = ({
  type,
  marks,
}: {
  type: PaperQuestionType;
  marks: number;
}) => {
  const { t } = useTranslation("papers");
  return <>{`${t(toQuestionTypeLabelKey(type))} • ${marks} marks`}</>;
};

const QuestionCatalogBadge = ({ isSelected }: { isSelected: boolean }) => {
  const { t } = useTranslation("papers");
  return (
    <View style={[styles.catalogSelectBadge, isSelected && styles.catalogSelectBadgeActive]}>
      <Text
        style={[
          styles.catalogSelectBadgeLabel,
          isSelected && styles.catalogSelectBadgeLabelActive,
        ]}
      >
        {isSelected ? t("home.selectedQuestion") : t("home.selectQuestion")}
      </Text>
    </View>
  );
};

export const PapersHomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const { formatDateTime } = useAppDateTimeFormatter();
  const papersQuery = useQuestionPapersQuery();
  const exportedPapersQuery = useExportedQuestionPapersQuery();
  const workspaceMetaQuery = useWorkspaceMetaQuery();
  const createMutation = useCreateQuestionPaperMutation();

  const [title, setTitle] = useState("Monthly Test Paper");
  const [search, setSearch] = useState("");
  const [count, setCount] = useState("10");
  const [questionType, setQuestionType] = useState<QuestionTypeFilter>("all");
  const [gradeId, setGradeId] = useState<FilterValue>("all");
  const [subjectId, setSubjectId] = useState<FilterValue>("all");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [quickGenerateOpen, setQuickGenerateOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<CatalogQuestion[]>([]);
  const [page, setPage] = useState(1);

  const visibleSubjects = useMemo(() => {
    if (!workspaceMetaQuery.data) return [];
    if (gradeId === "all") return workspaceMetaQuery.data.subjects;

    const allowedSubjectIds = new Set(
      workspaceMetaQuery.data.gradeSubjects
        .filter((entry) => entry.gradeId === gradeId)
        .map((entry) => entry.subjectId),
    );
    return workspaceMetaQuery.data.subjects.filter((subject) => allowedSubjectIds.has(subject.id));
  }, [gradeId, workspaceMetaQuery.data]);

  const countValue = Math.max(1, Math.min(50, Number.parseInt(count, 10) || 10));
  const selectedQuestionIds = useMemo(
    () => selectedQuestions.map((question) => question.id),
    [selectedQuestions],
  );
  const selectedMarks = useMemo(
    () => selectedQuestions.reduce((total, question) => total + question.marks, 0),
    [selectedQuestions],
  );
  const selectedQuestionIdSet = useMemo(
    () => new Set(selectedQuestionIds),
    [selectedQuestionIds],
  );

  const activeFilters = useMemo<ActiveFilterChip[]>(() => {
    const values: ActiveFilterChip[] = [];

    if (questionType !== "all") {
      values.push({
        key: "questionType",
        label: `Type: ${t(toQuestionTypeLabelKey(questionType as PaperQuestionType))}`,
      });
    }

    const gradeLabel = workspaceMetaQuery.data?.grades.find((grade) => grade.id === gradeId)?.name;
    if (gradeLabel) {
      values.push({ key: "gradeId", label: `${t("home.paperFilters").replace(" Filters", "")}: ${gradeLabel}` });
    }

    const subjectLabel = visibleSubjects.find((subject) => subject.id === subjectId)?.name;
    if (subjectLabel) {
      values.push({ key: "subjectId", label: `Subject: ${subjectLabel}` });
    }

    if (search.trim()) {
      values.push({ key: "search", label: `Search: ${search.trim()}` });
    }

    return values;
  }, [gradeId, questionType, search, subjectId, t, visibleSubjects, workspaceMetaQuery.data?.grades]);

  const removeActiveFilter = (filterKey: ActiveFilterChip["key"]) => {
    if (filterKey === "questionType") {
      setQuestionType("all");
      setPage(1);
      return;
    }

    if (filterKey === "gradeId") {
      setGradeId("all");
      setSubjectId("all");
      setPage(1);
      return;
    }

    if (filterKey === "subjectId") {
      setSubjectId("all");
      setPage(1);
      return;
    }

    if (filterKey === "search") {
      setSearch("");
      setPage(1);
    }
  };

  const quickTypeCountsQuery = useQuickTypeCountsQuery(
    {
      search: search.trim() || undefined,
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
    },
    QUICK_TYPE_FILTERS.map((option) => option.value),
  );

  const catalogQuery = useWorkspaceCatalogQuery(
    {
      search: search.trim() || undefined,
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
      questionType: questionType === "all" ? undefined : questionType,
      page,
      pageSize: 20,
    },
    true,
  );
  const totalPages = catalogQuery.data?.totalPages ?? 1;
  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };
  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };
  const papersRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      papersQuery.refetch(),
      exportedPapersQuery.refetch(),
      workspaceMetaQuery.refetch(),
      quickTypeCountsQuery.refetch(),
      catalogQuery.refetch(),
    ]);
  });

  const paperSheetSubtitle = useMemo(() => {
    const matchedCount = catalogQuery.data?.total ?? 0;
    return t("home.matchingQuestions", { count: matchedCount });
  }, [catalogQuery.data?.total, t]);

  const toggleSelectedQuestion = (question: CatalogQuestion) => {
    setSelectedQuestions((current) => {
      if (current.some((item) => item.id === question.id)) {
        return current.filter((item) => item.id !== question.id);
      }

      return [...current, question];
    });
  };

  const removeSelectedQuestion = (questionId: string) => {
    setSelectedQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestions([]);
  };

  const createFromSelected = async () => {
    if (!title.trim() || selectedQuestionIds.length === 0 || createMutation.isPending) {
      return;
    }

    setCreateError(null);
    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        includeAnswerKey,
        questionIds: selectedQuestionIds,
      });
      setSelectedQuestions([]);
      router.push(`/papers/${created.id}` as RelativePathString);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : t("home.failedCreate"));
    }
  };

  const createQuickGeneratedPaper = async () => {
    if (!title.trim() || createMutation.isPending) {
      return;
    }

    setCreateError(null);
    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        search: search.trim() || undefined,
        gradeId: gradeId === "all" ? undefined : gradeId,
        subjectId: subjectId === "all" ? undefined : subjectId,
        questionType: questionType === "all" ? undefined : questionType,
        includeAnswerKey,
        count: countValue,
      });
      router.push(`/papers/${created.id}` as RelativePathString);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : t("home.failedCreate"));
    }
  };

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
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>{t("home.title")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.openHelp")}
              style={({ pressed }) => [styles.helpIconButton, pressed && styles.buttonPressed]}
              onPress={() => setHelpSheetOpen(true)}
            >
              <SymbolView
                name={{ ios: "questionmark.circle.fill", android: "help", web: "help" }}
                size={18}
                tintColor="#1D4ED8"
              />
            </Pressable>
          </View>
          <Text style={styles.subheading}>
            {t("home.subtitle")}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.selectionHeaderRow}>
            <View style={styles.selectionHeaderTextWrap}>
              <Text style={styles.cardTitle}>{t("home.buildTitle")}</Text>
              <Text style={styles.metaText}>{t("home.buildHint")}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.filtersOpenButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setFiltersOpen(true)}
            >
              <Text style={styles.secondaryButtonLabel}>
                {`${t("home.filtersButton")}${activeFilters.length > 0 ? `(${activeFilters.length})` : ""}`}
              </Text>
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("home.paperTitle")}</Text>
            <TextInput
              placeholder={t("home.paperTitlePlaceholder")}
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("home.questionSearch")}</Text>
            <TextInput
              placeholder={t("home.questionSearchPlaceholder")}
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </View>

          <View style={styles.quickFiltersBlock}>
            <Text style={styles.label}>{t("home.quickType")}</Text>
            <View style={styles.quickFilterRow}>
              {QUICK_TYPE_FILTERS.map((option) => {
                const isSelected = questionType === option.value;
                const countText =
                  typeof quickTypeCountsQuery.counts[option.value] === "number"
                    ? `${quickTypeCountsQuery.counts[option.value]}`
                    : quickTypeCountsQuery.isLoading
                      ? "..."
                      : "-";
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.quickFilterChip,
                      isSelected && styles.quickFilterChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      setQuestionType(option.value);
                      setPage(1);
                    }}
                  >
                    <View style={styles.quickFilterChipTopRow}>
                      <View
                        style={[
                          styles.quickFilterIconWrap,
                          { backgroundColor: option.accentSoft },
                          isSelected && styles.quickFilterIconWrapActive,
                        ]}
                      >
                        <SymbolView
                          name={option.icon}
                          size={14}
                          tintColor={isSelected ? "#FFFFFF" : option.accentColor}
                        />
                      </View>

                      <View
                        style={[
                          styles.quickFilterCountBadge,
                          { backgroundColor: isSelected ? "#FFFFFF" : option.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickFilterCountBadgeLabel,
                            { color: isSelected ? "#1D4ED8" : option.accentColor },
                          ]}
                        >
                          {countText}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.quickFilterChipEyebrow,
                        { color: isSelected ? "rgba(255, 255, 255, 0.8)" : option.accentColor },
                      ]}
                    >
                      {t(option.shortLabelKey)}
                    </Text>
                    <Text
                      style={[
                        styles.quickFilterChipLabel,
                        isSelected && styles.quickFilterChipLabelActive,
                      ]}
                    >
                      {t(option.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <FilterSummaryBar
            items={activeFilters}
            emptyText={t("home.noFilters")}
            onRemove={removeActiveFilter}
          />

          <Pressable
            style={({ pressed }) => [
              styles.checkboxRow,
              includeAnswerKey && styles.checkboxRowActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setIncludeAnswerKey((value) => !value)}
          >
            <Text style={styles.checkboxLabel}>
              {includeAnswerKey ? "✓ " : ""}{t("home.includeAnswerKey")}
            </Text>
          </Pressable>

          <View style={styles.selectionSummaryCard}>
            <View style={styles.selectionSummaryHeader}>
              <View style={styles.selectionMetricCard}>
                <Text style={styles.selectionMetricValue}>{selectedQuestionIds.length}</Text>
                <Text style={styles.selectionMetricLabel}>{t("home.selected")}</Text>
              </View>
              <View style={styles.selectionMetricCard}>
                <Text style={styles.selectionMetricValue}>{selectedMarks}</Text>
                <Text style={styles.selectionMetricLabel}>{t("home.totalMarks")}</Text>
              </View>
              <View style={styles.selectionMetricCardWide}>
                <Text style={styles.selectionMetricCopy}>
                  {selectedQuestionIds.length > 0
                    ? t("home.readyToCreate")
                    : t("home.selectToStart")}
                </Text>
              </View>
            </View>

            {selectedQuestions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedChipRow}
              >
                {selectedQuestions.map((question) => (
                  <SelectedQuestionChip
                    key={question.id}
                    question={question}
                    onRemove={removeSelectedQuestion}
                  />
                ))}
              </ScrollView>
            ) : (
              <MiniHelpHint hint={t("home.addHint")} />
            )}

            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            <View style={styles.selectionActionRow}>
              <Pressable
                disabled={selectedQuestionIds.length === 0 || createMutation.isPending}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.selectionPrimaryButton,
                  (selectedQuestionIds.length === 0 || createMutation.isPending) &&
                    styles.buttonDisabled,
                  pressed && selectedQuestionIds.length > 0 && styles.buttonPressed,
                ]}
                onPress={createFromSelected}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>{t("home.createDraftFromSelected")}</Text>
                )}
              </Pressable>

              <Pressable
                disabled={selectedQuestionIds.length === 0 || createMutation.isPending}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  selectedQuestionIds.length === 0 && styles.buttonDisabled,
                  pressed && selectedQuestionIds.length > 0 && styles.buttonPressed,
                ]}
                onPress={clearSelectedQuestions}
              >
                <Text style={styles.secondaryButtonLabel}>{t("home.clear")}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.catalogHeaderRow}>
            <View style={styles.catalogHeaderTextWrap}>
              <Text style={styles.cardTitle}>{t("home.questionCatalog")}</Text>
              <Text style={styles.metaText}>{t("home.questionCatalogHint")}</Text>
            </View>
            {catalogQuery.data ? (
              <Text style={styles.catalogCountText}>
                {t("home.pageSummary", {
                  page: catalogQuery.data.page,
                  totalPages: catalogQuery.data.totalPages,
                  total: catalogQuery.data.total,
                })}
              </Text>
            ) : null}
          </View>

          {catalogQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("home.loadingCatalog")}</Text>
            </View>
          ) : null}

          {catalogQuery.isError ? (
            <Text style={styles.errorText}>
              {catalogQuery.error instanceof Error
                ? catalogQuery.error.message
                : t("home.failedCatalog")}
            </Text>
          ) : null}

          {catalogQuery.data && catalogQuery.data.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("home.noCatalogResults")}</Text>
              <MiniHelpHint hint={t("home.noCatalogHint")} />
            </View>
          ) : null}

          <View style={styles.catalogList}>
            {catalogQuery.data?.rows.map((question) => (
              <QuestionCatalogCard
                key={question.id}
                question={question}
                isSelected={selectedQuestionIdSet.has(question.id)}
                onToggle={toggleSelectedQuestion}
              />
            ))}
          </View>

          {catalogQuery.data && catalogQuery.data.totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <Pressable
                disabled={page <= 1}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  page <= 1 && styles.buttonDisabled,
                  pressed && page > 1 && styles.buttonPressed,
                ]}
                onPress={goToPreviousPage}
              >
                <Text style={styles.secondaryButtonLabel}>{t("common:actions.previous")}</Text>
              </Pressable>

              <Text style={styles.metaText}>
                {t("home.pageSummary", {
                  page,
                  totalPages: catalogQuery.data.totalPages,
                  total: catalogQuery.data.total,
                })}
              </Text>

              <Pressable
                disabled={page >= catalogQuery.data.totalPages}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  page >= catalogQuery.data.totalPages && styles.buttonDisabled,
                  pressed && page < catalogQuery.data.totalPages && styles.buttonPressed,
                ]}
                onPress={goToNextPage}
              >
                <Text style={styles.secondaryButtonLabel}>{t("common:actions.next")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.quickGenerateCard}>
          <Pressable
            style={({ pressed }) => [styles.quickGenerateHeader, pressed && styles.buttonPressed]}
            onPress={() => setQuickGenerateOpen((value) => !value)}
          >
            <View style={styles.quickGenerateHeaderTextWrap}>
              <Text style={styles.cardTitle}>{t("home.quickGenerate")}</Text>
              <Text style={styles.metaText}>{t("home.quickGenerateHint")}</Text>
            </View>
            <Text style={styles.quickGenerateToggle}>{quickGenerateOpen ? t("home.hide") : t("home.show")}</Text>
          </Pressable>

          {quickGenerateOpen ? (
            <View style={styles.quickGenerateBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("home.questionCount")}</Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder={t("home.questionCountPlaceholder")}
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={count}
                  onChangeText={setCount}
                />
              </View>
              <Pressable
                disabled={!title.trim() || createMutation.isPending}
                style={({ pressed }) => [
                  styles.secondaryDarkButton,
                  (!title.trim() || createMutation.isPending) && styles.buttonDisabled,
                  pressed && title.trim() && styles.buttonPressed,
                ]}
                onPress={createQuickGeneratedPaper}
              >
                <Text style={styles.secondaryDarkButtonLabel}>{t("home.quickGenerateDraft")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("home.savedPapers")}</Text>

          {papersQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("home.loadingPapers")}</Text>
            </View>
          ) : null}

          {papersQuery.isError ? (
            <Text style={styles.errorText}>
              {papersQuery.error instanceof Error ? papersQuery.error.message : t("home.failedPapers")}
            </Text>
          ) : null}

          {papersQuery.data?.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("home.noPapers")}</Text>
              <MiniHelpHint hint={t("home.noPapersHint")} />
            </View>
          ) : null}

          {papersQuery.data?.rows.map((paper) => (
            <Pressable
              key={paper.id}
              style={({ pressed }) => [styles.paperCard, pressed && styles.buttonPressed]}
              onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
            >
              <View style={styles.paperHeadingRow}>
                <Text style={styles.paperTitle}>{paper.title}</Text>
                <Text style={styles.statusPill}>{t(toStatusLabel(paper.status, paper.exportedAt))}</Text>
              </View>
              <Text style={styles.paperMeta}>
                {paper.totalQuestions} questions • {paper.totalMarks} marks
              </Text>
              <Text style={styles.paperMeta}>{t("home.updated", { value: formatDateTime(paper.updatedAt) })}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("home.recentExports")}</Text>
          <Text style={styles.metaText}>{t("home.recentExportsHint")}</Text>

          {exportedPapersQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("home.loadingExports")}</Text>
            </View>
          ) : null}

          {exportedPapersQuery.isError ? (
            <Text style={styles.errorText}>
              {exportedPapersQuery.error instanceof Error
                ? exportedPapersQuery.error.message
                : t("home.failedExports")}
            </Text>
          ) : null}

          {exportedPapersQuery.data?.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("home.noExports")}</Text>
              <MiniHelpHint hint={t("home.noExportsHint")} />
            </View>
          ) : null}

          {exportedPapersQuery.data?.rows.slice(0, 5).map((paper) => (
            <Pressable
              key={paper.id}
              style={({ pressed }) => [styles.paperCard, pressed && styles.buttonPressed]}
              onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
            >
              <View style={styles.paperHeadingRow}>
                <Text style={styles.paperTitle}>{paper.title}</Text>
                <Text style={[styles.statusPill, styles.exportedPill]}>{t("status.exported")}</Text>
              </View>
              <Text style={styles.paperMeta}>
                {paper.totalQuestions} questions • {paper.totalMarks} marks
              </Text>
              <Text style={styles.paperMeta}>{t("home.exportedAt", { value: formatDateTime(paper.exportedAt) })}</Text>
            </Pressable>
          ))}
        </View>

        <BottomSheet
          visible={filtersOpen}
          title={t("home.paperFilters")}
          subtitle={paperSheetSubtitle}
          onClose={() => setFiltersOpen(false)}
          footer={
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  setQuestionType("all");
                  setGradeId("all");
                  setSubjectId("all");
                  setPage(1);
                }}
              >
                <Text style={styles.secondaryButtonLabel}>{t("common:actions.reset")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={() => setFiltersOpen(false)}
              >
                <Text style={styles.primaryButtonLabel}>{t("common:actions.done")}</Text>
              </Pressable>
            </View>
          }
        >
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FilterChips
              title={t("home.questionTypeFilter")}
              selectedValue={questionType}
              onSelect={(value) => {
                setQuestionType(value as QuestionTypeFilter);
                setPage(1);
              }}
              options={QUESTION_TYPE_FILTERS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
            />

            <FilterChips
              title={t("home.gradeFilter")}
              selectedValue={gradeId}
              onSelect={(value) => {
                setGradeId(value);
                setSubjectId("all");
                setPage(1);
              }}
              options={(workspaceMetaQuery.data?.grades ?? []).map((grade) => ({
                value: grade.id,
                label: grade.name,
              }))}
            />

            <FilterChips
              title={t("home.subjectFilter")}
              selectedValue={subjectId}
              onSelect={(value) => {
                setSubjectId(value);
                setPage(1);
              }}
              options={visibleSubjects.map((subject) => ({
                value: subject.id,
                label: subject.name,
              }))}
            />
          </ScrollView>
        </BottomSheet>

        <BottomSheet
          visible={helpSheetOpen}
          title={t("home.papersQuickGuide")}
          subtitle={t("home.papersQuickGuideSubtitle")}
          onClose={() => setHelpSheetOpen(false)}
          footer={
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => setHelpSheetOpen(false)}
              >
                <Text style={styles.secondaryButtonLabel}>{t("common:actions.close")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  setHelpSheetOpen(false);
                  router.push("/settings/help" as RelativePathString);
                }}
              >
                <Text style={styles.primaryButtonLabel}>{t("home.fullGuide")}</Text>
              </Pressable>
            </View>
          }
        >
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PAPER_GUIDE_STEPS.map((step, index) => (
              <View key={`paper-guide-${step.titleKey}`} style={styles.helpStepRow}>
                <View style={[styles.helpStepNumber, { backgroundColor: step.accentSoft }]}>
                  <Text style={[styles.helpStepNumberLabel, { color: step.accentColor }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.helpStepTextWrap}>
                  <View style={styles.helpStepHeader}>
                    <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
                    <Text style={styles.helpStepTitle}>{t(step.titleKey)}</Text>
                  </View>
                  <Text style={styles.helpStepHint}>{t(step.hintKey)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </BottomSheet>
      </ScrollView>
    </AppShell>
  );
};

type FilterChipsProps = {
  title: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

const FilterChips = ({ title, selectedValue, onSelect, options }: FilterChipsProps) => (
  <View style={styles.filterWrap}>
    <Text style={styles.label}>{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
      <Pressable
        style={({ pressed }) => [
          styles.filterChip,
          selectedValue === "all" && styles.filterChipActive,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => onSelect("all")}
      >
        <Text style={[styles.filterChipLabel, selectedValue === "all" && styles.filterChipLabelActive]}>
          All
        </Text>
      </Pressable>
      {options.map((option) => (
        <Pressable
          key={`${title}-${option.value}`}
          style={({ pressed }) => [
            styles.filterChip,
            selectedValue === option.value && styles.filterChipActive,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.filterChipLabel,
              selectedValue === option.value && styles.filterChipLabelActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
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
  subheading: {
    color: "#4B5563",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  quickGenerateCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  selectionHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  selectionHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  filtersOpenButton: {
    minHeight: 38,
    minWidth: 92,
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
  filterWrap: {
    gap: 8,
  },
  filterScroll: {
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
  quickFiltersBlock: {
    gap: 8,
  },
  quickFilterRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickFilterChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D7E0EC",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 84,
    padding: 12,
  },
  quickFilterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  quickFilterChipTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickFilterIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  quickFilterIconWrapActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  quickFilterCountBadge: {
    borderRadius: 999,
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickFilterCountBadgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  quickFilterChipEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  quickFilterChipLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  quickFilterChipLabelActive: {
    color: "#FFFFFF",
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
  selectionSummaryCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#DBEAFE",
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  selectionSummaryHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectionMetricCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionMetricCardWide: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionMetricValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  selectionMetricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selectionMetricCopy: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
  },
  selectedChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  selectedChip: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedChipLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  selectedChipRemove: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selectionActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  selectionPrimaryButton: {
    flex: 1,
  },
  catalogHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  catalogHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  catalogCountText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  catalogList: {
    gap: 10,
  },
  paginationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  catalogCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  catalogCardSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
  },
  catalogCardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  catalogCardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  catalogQuestionCode: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  catalogQuestionMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  catalogQuestionBody: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
  },
  catalogQuestionMetaSecondary: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
  },
  catalogSelectBadge: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  catalogSelectBadgeActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  catalogSelectBadgeLabel: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  catalogSelectBadgeLabelActive: {
    color: "#FFFFFF",
  },
  quickGenerateHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  quickGenerateHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  quickGenerateToggle: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  quickGenerateBody: {
    gap: 10,
  },
  secondaryDarkButton: {
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  secondaryDarkButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    color: "#64748B",
    fontSize: 13,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  helpStepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  helpStepNumber: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24,
  },
  helpStepNumberLabel: {
    fontSize: 12,
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
  emptyStateBlock: {
    gap: 10,
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
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    gap: 14,
    paddingBottom: 4,
  },
});
