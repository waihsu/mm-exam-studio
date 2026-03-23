import { SymbolView } from "expo-symbols";
import { useRouter, type RelativePathString } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MathRichText } from "@/components/ui/math-rich-text";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FilterSummaryBar } from "@/components/ui/filter-summary-bar";
import { MiniHelpHint } from "@/components/ui/mini-help-hint";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useTranslation } from "@/i18n";
import {
  hasSeenAppOnboarding,
  markAppOnboardingSeen,
} from "@/features/onboarding/services/app-onboarding-store";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useWorkspaceMetaQuery } from "@/features/workspace/hooks/use-workspace-meta-query";
import { useCreatePracticeSessionMutation } from "../hooks/use-create-practice-session-mutation";
import { usePracticeSessionsQuery } from "../hooks/use-practice-sessions-query";
import { useQuickTypeCountsQuery } from "../hooks/use-quick-type-counts-query";
import { useWorkspaceCatalogQuery } from "../hooks/use-workspace-catalog-query";
import type { PracticeQuestionType } from "../types/practice.types";

type QuestionTypeFilter = PracticeQuestionType | "all";
type FilterValue = string | "all";
type FilterOption = {
  value: FilterValue;
  label: string;
};
type ActiveFilterChip = {
  key: string;
  label: string;
};

const QUESTION_TYPE_FILTERS: Array<{ value: QuestionTypeFilter; labelKey: string }> = [
  { value: "all", labelKey: "practice:questionTypes.all" },
  { value: "mcq", labelKey: "practice:questionTypes.mcq" },
  { value: "true_false", labelKey: "practice:questionTypes.trueFalse" },
  { value: "short_answer", labelKey: "practice:questionTypes.short" },
  { value: "long_answer", labelKey: "practice:questionTypes.long" },
  { value: "fill_blank", labelKey: "practice:questionTypes.fillBlank" },
  { value: "matching", labelKey: "practice:questionTypes.matching" },
];
const PRACTICE_EXCLUDED_TYPES: PracticeQuestionType[] = ["long_answer"];

const QUICK_TYPE_FILTERS: Array<{
  value: QuestionTypeFilter;
  labelKey: string;
  shortLabelKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
}> = [
  {
    value: "all",
    labelKey: "practice:questionTypes.allTypes",
    shortLabelKey: "practice:questionTypes.all",
    icon: { ios: "square.grid.2x2.fill", android: "grid_view", web: "grid_view" },
    accentColor: "#475569",
    accentSoft: "#E2E8F0",
  },
  {
    value: "mcq",
    labelKey: "practice:questionTypes.mcq",
    shortLabelKey: "practice:questionTypes.mcq",
    icon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    value: "short_answer",
    labelKey: "practice:questionTypes.shortAnswer",
    shortLabelKey: "practice:questionTypes.short",
    icon: { ios: "text.alignleft", android: "short_text", web: "short_text" },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
  },
];

const PRACTICE_GUIDE_STEPS: Array<{
  titleKey: string;
  hintKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
}> = [
  {
    titleKey: "practice:home.guideFilterTitle",
    hintKey: "practice:home.guideFilterHint",
    icon: {
      ios: "line.3.horizontal.decrease.circle.fill",
      android: "filter_alt",
      web: "filter_alt",
    },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    titleKey: "practice:home.guideSelectTitle",
    hintKey: "practice:home.guideSelectHint",
    icon: {
      ios: "checkmark.circle.fill",
      android: "check_circle",
      web: "check_circle",
    },
    accentColor: "#047857",
    accentSoft: "#DCFCE7",
  },
  {
    titleKey: "practice:home.guideQuickStartTitle",
    hintKey: "practice:home.guideQuickStartHint",
    icon: {
      ios: "play.circle.fill",
      android: "play_circle",
      web: "play_circle",
    },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
  },
  {
    titleKey: "practice:home.guideResumeTitle",
    hintKey: "practice:home.guideResumeHint",
    icon: {
      ios: "clock.arrow.circlepath",
      android: "history",
      web: "history",
    },
    accentColor: "#7C3AED",
    accentSoft: "#EDE9FE",
  },
];

const toQuestionTypeLabelKey = (value: string) => {
  if (value === "mcq") return "practice:questionTypes.mcq";
  if (value === "true_false") return "practice:questionTypes.trueFalse";
  if (value === "short_answer") return "practice:questionTypes.shortAnswer";
  if (value === "long_answer") return "practice:questionTypes.longAnswer";
  if (value === "fill_blank") return "practice:questionTypes.fillBlank";
  if (value === "matching") return "practice:questionTypes.matching";
  return value;
};

const formatScore = (value: number | null) => {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(1)}%`;
};

export const PracticeHomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["practice", "common"]);
  const insets = useSafeAreaInsets();
  const { formatDateTime } = useAppDateTimeFormatter();
  const authSessionQuery = useAuthSessionQuery();
  const workspaceMetaQuery = useWorkspaceMetaQuery();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [questionType, setQuestionType] = useState<QuestionTypeFilter>("all");
  const [gradeId, setGradeId] = useState<FilterValue>("all");
  const [subjectId, setSubjectId] = useState<FilterValue>("all");
  const [chapterId, setChapterId] = useState<FilterValue>("all");
  const [subChapterId, setSubChapterId] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const createSessionMutation = useCreatePracticeSessionMutation();

  useEffect(() => {
    let cancelled = false;

    const userId = authSessionQuery.data?.user.id;
    if (!userId) {
      setOnboardingVisible(false);
      return;
    }

    const loadOnboardingState = async () => {
      const seen = await hasSeenAppOnboarding(userId);
      if (!cancelled && !seen) {
        setOnboardingVisible(true);
      }
    };

    void loadOnboardingState();

    return () => {
      cancelled = true;
    };
  }, [authSessionQuery.data?.user.id]);

  const dismissOnboarding = async () => {
    const userId = authSessionQuery.data?.user.id;
    setOnboardingVisible(false);
    await markAppOnboardingSeen(userId);
  };

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

  const visibleChapters = useMemo(() => {
    if (!workspaceMetaQuery.data) return [];

    return workspaceMetaQuery.data.chapters.filter((chapter) => {
      if (gradeId !== "all" && chapter.gradeId !== gradeId) return false;
      if (subjectId !== "all" && chapter.subjectId !== subjectId) return false;
      return true;
    });
  }, [gradeId, subjectId, workspaceMetaQuery.data]);

  const visibleSubChapters = useMemo(() => {
    if (!workspaceMetaQuery.data) return [];

    const visibleChapterIds = new Set(visibleChapters.map((chapter) => chapter.id));
    return workspaceMetaQuery.data.subChapters.filter((subChapter) => {
      if (chapterId !== "all") {
        return subChapter.chapterId === chapterId;
      }
      return visibleChapterIds.has(subChapter.chapterId);
    });
  }, [chapterId, visibleChapters, workspaceMetaQuery.data]);

  const gradeOptions = useMemo<FilterOption[]>(
    () =>
      (workspaceMetaQuery.data?.grades ?? []).map((grade) => ({
        value: grade.id,
        label: grade.name,
      })),
    [workspaceMetaQuery.data?.grades],
  );

  const subjectOptions = useMemo<FilterOption[]>(
    () =>
      visibleSubjects.map((subject) => ({
        value: subject.id,
        label: subject.name,
      })),
    [visibleSubjects],
  );

  const chapterOptions = useMemo<FilterOption[]>(
    () =>
      visibleChapters.map((chapter) => ({
        value: chapter.id,
        label: chapter.name,
      })),
    [visibleChapters],
  );

  const subChapterOptions = useMemo<FilterOption[]>(
    () =>
      visibleSubChapters.map((subChapter) => ({
        value: subChapter.id,
        label: subChapter.name,
      })),
    [visibleSubChapters],
  );

  const catalogParams = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      questionType: questionType === "all" ? undefined : questionType,
      excludeQuestionTypes: PRACTICE_EXCLUDED_TYPES,
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
      chapterId: chapterId === "all" ? undefined : chapterId,
      subChapterId: subChapterId === "all" ? undefined : subChapterId,
      page,
      pageSize: 20,
    }),
    [chapterId, gradeId, page, questionType, searchTerm, subjectId, subChapterId],
  );

  const catalogQuery = useWorkspaceCatalogQuery(catalogParams);
  const quickTypeCountsQuery = useQuickTypeCountsQuery(
    {
      search: searchTerm.trim() || undefined,
      excludeQuestionTypes: PRACTICE_EXCLUDED_TYPES,
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
      chapterId: chapterId === "all" ? undefined : chapterId,
      subChapterId: subChapterId === "all" ? undefined : subChapterId,
    },
    QUICK_TYPE_FILTERS.map((option) => option.value),
  );
  const sessionsQuery = usePracticeSessionsQuery();
  const practiceRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      authSessionQuery.refetch(),
      workspaceMetaQuery.refetch(),
      catalogQuery.refetch(),
      quickTypeCountsQuery.refetch(),
      sessionsQuery.refetch(),
    ]);
  });
  const totalPages = catalogQuery.data?.totalPages ?? 1;
  const hasSelectedQuestions = selectedQuestionIds.length > 0;

  const selectedCountInPage = useMemo(
    () =>
      catalogQuery.data?.rows.filter((row) => selectedQuestionIds.includes(row.id)).length ?? 0,
    [catalogQuery.data?.rows, selectedQuestionIds],
  );

  const activeFilters = useMemo<ActiveFilterChip[]>(() => {
    const values: ActiveFilterChip[] = [];

    if (questionType !== "all") {
      values.push({
        key: "questionType",
        label: `${t("practice:filters.type")}: ${t(toQuestionTypeLabelKey(questionType))}`,
      });
    }

    const gradeLabel = gradeOptions.find((option) => option.value === gradeId)?.label;
    if (gradeLabel) {
      values.push({
        key: "gradeId",
        label: `${t("practice:filters.grade")}: ${gradeLabel}`,
      });
    }

    const subjectLabel = subjectOptions.find((option) => option.value === subjectId)?.label;
    if (subjectLabel) {
      values.push({
        key: "subjectId",
        label: `${t("practice:filters.subject")}: ${subjectLabel}`,
      });
    }

    const chapterLabel = chapterOptions.find((option) => option.value === chapterId)?.label;
    if (chapterLabel) {
      values.push({
        key: "chapterId",
        label: `${t("practice:filters.chapter")}: ${chapterLabel}`,
      });
    }

    const subChapterLabel = subChapterOptions.find(
      (option) => option.value === subChapterId,
    )?.label;
    if (subChapterLabel) {
      values.push({
        key: "subChapterId",
        label: `${t("practice:filters.lesson")}: ${subChapterLabel}`,
      });
    }

    if (searchTerm.trim()) {
      values.push({
        key: "search",
        label: `${t("practice:filters.search")}: ${searchTerm.trim()}`,
      });
    }

    return values;
  }, [
    chapterId,
    chapterOptions,
    gradeId,
    gradeOptions,
    questionType,
    searchTerm,
    subjectId,
    subjectOptions,
    subChapterId,
    subChapterOptions,
    t,
  ]);

  const removeActiveFilter = (filterKey: ActiveFilterChip["key"]) => {
    if (filterKey === "questionType") {
      selectQuestionType("all");
      return;
    }

    if (filterKey === "gradeId") {
      selectGrade("all");
      return;
    }

    if (filterKey === "subjectId") {
      selectSubject("all");
      return;
    }

    if (filterKey === "chapterId") {
      selectChapter("all");
      return;
    }

    if (filterKey === "subChapterId") {
      selectSubChapter("all");
      return;
    }

    if (filterKey === "search") {
      setSearchInput("");
      setSearchTerm("");
      setPage(1);
    }
  };

  const practiceSheetSubtitle = useMemo(() => {
    const matchedCount = catalogQuery.data?.total ?? 0;
    const selectedCount = selectedQuestionIds.length;
    return t("practice:home.practiceFiltersSubtitle", {
      matches: matchedCount,
      selected: selectedCount,
    });
  }, [catalogQuery.data?.total, selectedQuestionIds.length, t]);

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((current) => {
      if (current.includes(questionId)) {
        return current.filter((id) => id !== questionId);
      }
      return [...current, questionId];
    });
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const applySearch = () => {
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setQuestionType("all");
    setGradeId("all");
    setSubjectId("all");
    setChapterId("all");
    setSubChapterId("all");
    setPage(1);
  };

  const selectQuestionType = (value: QuestionTypeFilter) => {
    setQuestionType(value);
    setPage(1);
  };

  const selectGrade = (value: FilterValue) => {
    setGradeId(value);
    setSubjectId("all");
    setChapterId("all");
    setSubChapterId("all");
    setPage(1);
  };

  const selectSubject = (value: FilterValue) => {
    setSubjectId(value);
    setChapterId("all");
    setSubChapterId("all");
    setPage(1);
  };

  const selectChapter = (value: FilterValue) => {
    setChapterId(value);
    setSubChapterId("all");
    setPage(1);
  };

  const selectSubChapter = (value: FilterValue) => {
    setSubChapterId(value);
    setPage(1);
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const startWithSelected = async () => {
    if (selectedQuestionIds.length === 0 || createSessionMutation.isPending) {
      return;
    }

    setActionError(null);

    try {
      const result = await createSessionMutation.mutateAsync({
        title: t("practice:home.selectedPracticeTitle"),
        questionIds: selectedQuestionIds,
        search: searchTerm.trim() || undefined,
        gradeId: gradeId === "all" ? undefined : gradeId,
        subjectId: subjectId === "all" ? undefined : subjectId,
        chapterId: chapterId === "all" ? undefined : chapterId,
        subChapterId: subChapterId === "all" ? undefined : subChapterId,
        questionType: questionType === "all" ? undefined : questionType,
      });
      setSelectedQuestionIds([]);
      router.push(`/practice/${result.id}` as RelativePathString);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("practice:home.createFailed"),
      );
    }
  };

  const quickStart = async () => {
    if (createSessionMutation.isPending) {
      return;
    }

    setActionError(null);

    try {
      const result = await createSessionMutation.mutateAsync({
        title: t("practice:home.quickPracticeTitle"),
        count: 10,
        search: searchTerm.trim() || undefined,
        gradeId: gradeId === "all" ? undefined : gradeId,
        subjectId: subjectId === "all" ? undefined : subjectId,
        chapterId: chapterId === "all" ? undefined : chapterId,
        subChapterId: subChapterId === "all" ? undefined : subChapterId,
        questionType: questionType === "all" ? undefined : questionType,
      });
      setSelectedQuestionIds([]);
      router.push(`/practice/${result.id}` as RelativePathString);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("practice:home.createFailed"));
    }
  };

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: hasSelectedQuestions ? 148 + insets.bottom : 20 },
        ]}
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
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>{t("practice:home.title")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("practice:home.openHelp")}
              style={({ pressed }) => [
                styles.helpIconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setHelpSheetOpen(true)}
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
          <Text style={styles.subheading}>{t("practice:home.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.filtersHeaderRow}>
            <View style={styles.filtersHeaderTextWrap}>
              <Text style={styles.cardTitle}>{t("practice:home.searchFiltersTitle")}</Text>
              <Text style={styles.metaText}>{t("practice:home.searchFiltersHint")}</Text>
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
                {`${t("practice:home.filtersButton")}${
                  activeFilters.length > 0 ? ` (${activeFilters.length})` : ""
                }`}
              </Text>
            </Pressable>
          </View>

          <TextInput
            placeholder={t("practice:home.searchPlaceholder")}
            placeholderTextColor="#8B94A6"
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={applySearch}
            returnKeyType="search"
          />

          <View style={styles.quickFiltersBlock}>
            <Text style={styles.filterTitle}>{t("practice:home.quickType")}</Text>
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
                      pressed && styles.filterChipPressed,
                    ]}
                    onPress={() => selectQuestionType(option.value)}
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

          {workspaceMetaQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("practice:home.loadingWorkspaceFilters")}</Text>
            </View>
          ) : null}

          {workspaceMetaQuery.isError ? (
            <Text style={styles.errorText}>
              {workspaceMetaQuery.error instanceof Error
                ? workspaceMetaQuery.error.message
                : t("practice:home.failedWorkspaceFilters")}
            </Text>
          ) : null}

          <FilterSummaryBar
            items={activeFilters}
            emptyText={t("practice:home.noFiltersApplied")}
            onRemove={removeActiveFilter}
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
              onPress={clearFilters}
            >
              <Text style={styles.ghostButtonLabel}>{t("common:actions.clear")}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={applySearch}
            >
              <Text style={styles.primaryButtonLabel}>{t("common:actions.apply")}</Text>
            </Pressable>
          </View>
        </View>

        <BottomSheet
          visible={filtersOpen}
          title={t("practice:home.practiceFiltersTitle")}
          subtitle={practiceSheetSubtitle}
          onClose={() => setFiltersOpen(false)}
          footer={
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
                onPress={clearFilters}
              >
                <Text style={styles.ghostButtonLabel}>{t("common:actions.reset")}</Text>
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
              title={t("practice:filters.type")}
              options={QUESTION_TYPE_FILTERS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
              selectedValue={questionType}
              onSelect={(value) => selectQuestionType(value as QuestionTypeFilter)}
            />
            <FilterChips
              title={t("practice:filters.grade")}
              options={gradeOptions}
              selectedValue={gradeId}
              onSelect={selectGrade}
            />
            <FilterChips
              title={t("practice:filters.subject")}
              options={subjectOptions}
              selectedValue={subjectId}
              onSelect={selectSubject}
            />
            <FilterChips
              title={t("practice:filters.chapter")}
              options={chapterOptions}
              selectedValue={chapterId}
              onSelect={selectChapter}
            />
            <FilterChips
              title={t("practice:filters.lesson")}
              options={subChapterOptions}
              selectedValue={subChapterId}
              onSelect={selectSubChapter}
            />
          </ScrollView>
        </BottomSheet>

        <BottomSheet
          visible={helpSheetOpen}
          title={t("practice:home.quickGuideTitle")}
          subtitle={t("practice:home.quickGuideSubtitle")}
          onClose={() => setHelpSheetOpen(false)}
          footer={
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
                onPress={() => setHelpSheetOpen(false)}
              >
                <Text style={styles.ghostButtonLabel}>{t("common:actions.close")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  setHelpSheetOpen(false);
                  router.push("/settings/help" as RelativePathString);
                }}
              >
                <Text style={styles.primaryButtonLabel}>{t("practice:home.fullGuide")}</Text>
              </Pressable>
            </View>
          }
        >
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PRACTICE_GUIDE_STEPS.map((step, index) => (
              <View key={`guide-${step.titleKey}`} style={styles.helpSheetStepRow}>
                <View style={[styles.helpSheetNumber, { backgroundColor: step.accentSoft }]}>
                  <Text style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.helpSheetStepTextWrap}>
                  <View style={styles.helpSheetStepHeader}>
                    <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
                    <Text style={styles.helpSheetStepTitle}>{t(step.titleKey)}</Text>
                  </View>
                  <Text style={styles.helpStepHint}>{t(step.hintKey)}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.metaText}>{t("practice:home.guideBestPattern")}</Text>
          </ScrollView>
        </BottomSheet>

        <View style={styles.card}>
          <View style={styles.catalogHeadingRow}>
            <Text style={styles.cardTitle}>{t("practice:home.catalogTitle")}</Text>
            <Text style={styles.metaText}>
              {catalogQuery.data
                ? t("practice:home.catalogPageSummary", {
                    page: catalogQuery.data.page,
                    totalPages: catalogQuery.data.totalPages,
                    rows: catalogQuery.data.rows.length,
                    total: catalogQuery.data.total,
                  })
                : "-"}
            </Text>
          </View>

          {catalogQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("practice:home.loadingCatalog")}</Text>
            </View>
          ) : null}

          {catalogQuery.isError ? (
            <Text style={styles.errorText}>
              {catalogQuery.error instanceof Error
                ? catalogQuery.error.message
                : t("practice:home.failedCatalog")}
            </Text>
          ) : null}

          {catalogQuery.data?.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("practice:home.noPublishedQuestions")}</Text>
              <MiniHelpHint
                hint={t("practice:home.noPublishedHint")}
              />
            </View>
          ) : null}

          {catalogQuery.data?.rows.map((question) => {
            const selected = selectedQuestionIds.includes(question.id);
            return (
              <Pressable
                key={question.id}
                style={({ pressed }) => [
                  styles.questionCard,
                  selected && styles.questionCardSelected,
                  pressed && styles.questionCardPressed,
                ]}
                onPress={() => toggleQuestion(question.id)}
              >
                <View style={styles.questionHeadingRow}>
                  <Text style={styles.questionCode}>{question.questionCode}</Text>
                  <Text style={styles.questionType}>{t(toQuestionTypeLabelKey(question.type))}</Text>
                </View>
                <MathRichText
                  content={question.title?.trim() || question.bodyPreview}
                  renderMode="native"
                  textStyle={styles.questionPreview}
                />
                <Text style={styles.questionMeta}>
                  {question.grade.name} • {question.subject.name} • {question.marks} marks
                </Text>
              </Pressable>
            );
          })}

          {catalogQuery.data && catalogQuery.data.lockedTotal > 0 ? (
            <Text style={styles.lockedText}>
              {t("practice:home.lockedQuestions", { count: catalogQuery.data.lockedTotal })}
            </Text>
          ) : null}

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

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
                {t("practice:home.catalogPageSummary", {
                  page,
                  totalPages: catalogQuery.data.totalPages,
                  rows: catalogQuery.data.rows.length,
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

          <View style={styles.buttonColumn}>
            {hasSelectedQuestions ? (
              <View style={styles.selectionStatusCard}>
                <View style={styles.selectionStatusHeader}>
                  <View style={styles.selectionStatusTextWrap}>
                    <Text style={styles.selectionStatusTitle}>
                      {t("practice:home.selectedQuestions", {
                        count: selectedQuestionIds.length,
                      })}
                    </Text>
                    <Text style={styles.selectionStatusHint}>
                      {t("practice:home.selectionHint", { count: selectedCountInPage })}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.selectionClearButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={clearSelectedQuestions}
                  >
                    <Text style={styles.selectionClearButtonLabel}>{t("common:actions.clear")}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Pressable
              disabled={createSessionMutation.isPending}
              style={({ pressed }) => [
                styles.secondaryButton,
                createSessionMutation.isPending && styles.buttonDisabled,
                pressed && !createSessionMutation.isPending && styles.buttonPressed,
              ]}
              onPress={quickStart}
            >
              <Text style={styles.secondaryButtonLabel}>{t("practice:home.quickStart")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.recentHeadingRow}>
            <Text style={styles.cardTitle}>{t("practice:home.recentSessionsTitle")}</Text>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
              onPress={() => router.push("/practice/sessions" as RelativePathString)}
            >
              <Text style={styles.linkButtonLabel}>{t("common:actions.viewAll")}</Text>
            </Pressable>
          </View>

          {sessionsQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("practice:home.loadingSessions")}</Text>
            </View>
          ) : null}

          {sessionsQuery.isError ? (
            <Text style={styles.errorText}>
              {sessionsQuery.error instanceof Error
                ? sessionsQuery.error.message
                : t("practice:home.failedSessions")}
            </Text>
          ) : null}

          {sessionsQuery.data?.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("practice:home.noSessions")}</Text>
              <MiniHelpHint
                hint={t("practice:home.noSessionsHint")}
              />
            </View>
          ) : null}

          {sessionsQuery.data?.rows.map((session) => (
            <Pressable
              key={session.id}
              style={({ pressed }) => [styles.sessionCard, pressed && styles.questionCardPressed]}
              onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
            >
              <View style={styles.sessionHeadingRow}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text
                  style={[
                    styles.sessionStatus,
                    session.status === "completed" ? styles.sessionStatusDone : styles.sessionStatusLive,
                  ]}
                >
                  {session.status}
                </Text>
              </View>
              <Text style={styles.sessionMeta}>
                {t("practice:sessions.scoreMeta", {
                  score: formatScore(session.scorePercent),
                  count: session.totalQuestions,
                })}
              </Text>
              <Text style={styles.sessionMeta}>
                {t("practice:sessions.startedMeta", { date: formatDateTime(session.startedAt) })}
              </Text>
            </Pressable>
          ))}
        </View>

        <BottomSheet
          visible={onboardingVisible}
          title={t("practice:home.onboardingSheetTitle")}
          subtitle={t("practice:home.onboardingSheetSubtitle")}
          onClose={() => {
            void dismissOnboarding();
          }}
          footer={
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  void dismissOnboarding();
                }}
              >
                <Text style={styles.ghostButtonLabel}>{t("practice:home.onboardingSkip")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  void dismissOnboarding().then(() => {
                    setHelpSheetOpen(true);
                  });
                }}
              >
                <Text style={styles.primaryButtonLabel}>
                  {t("practice:home.onboardingShowGuide")}
                </Text>
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
              <Text style={styles.onboardingHeroEyebrow}>{t("practice:home.onboardingEyebrow")}</Text>
              <Text style={styles.onboardingHeroTitle}>{t("practice:home.onboardingTitle")}</Text>
              <Text style={styles.helpStepHint}>{t("practice:home.onboardingBody")}</Text>
            </View>

            {PRACTICE_GUIDE_STEPS.map((step, index) => (
              <View key={`onboarding-${step.titleKey}`} style={styles.helpSheetStepRow}>
                <View style={[styles.helpSheetNumber, { backgroundColor: step.accentSoft }]}>
                  <Text style={[styles.helpSheetNumberLabel, { color: step.accentColor }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.helpSheetStepTextWrap}>
                  <View style={styles.helpSheetStepHeader}>
                    <SymbolView name={step.icon} size={16} tintColor={step.accentColor} />
                    <Text style={styles.helpSheetStepTitle}>{t(step.titleKey)}</Text>
                  </View>
                  <Text style={styles.helpStepHint}>{t(step.hintKey)}</Text>
                </View>
              </View>
            ))}

            <MiniHelpHint
              title={t("practice:home.onboardingHintTitle")}
              hint={t("practice:home.onboardingHint")}
            />
          </ScrollView>
        </BottomSheet>
      </ScrollView>

      {hasSelectedQuestions ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.stickyStartBar,
            { bottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.stickyStartCard}>
            <View style={styles.stickyStartTextWrap}>
              <Text style={styles.stickyStartTitle}>
                {t("practice:home.readyQuestions", { count: selectedQuestionIds.length })}
              </Text>
              <Text style={styles.stickyStartMeta}>{t("practice:home.readyHint")}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.stickyClearButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={clearSelectedQuestions}
            >
              <Text style={styles.secondaryButtonLabel}>{t("common:actions.clear")}</Text>
            </Pressable>

            <Pressable
              disabled={createSessionMutation.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.stickyStartButton,
                createSessionMutation.isPending && styles.buttonDisabled,
                pressed && !createSessionMutation.isPending && styles.buttonPressed,
              ]}
              onPress={startWithSelected}
            >
              {createSessionMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonLabel}>{t("practice:home.startSelected")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
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
    gap: 10,
    padding: 14,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
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
  filtersHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  filtersHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  filtersOpenButton: {
    minHeight: 38,
    minWidth: 92,
  },
  searchInput: {
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
  filterTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  filterScrollContent: {
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
  filterChipPressed: {
    opacity: 0.85,
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
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  buttonColumn: {
    gap: 8,
  },
  selectionStatusCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#DBEAFE",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionStatusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  selectionStatusTextWrap: {
    flex: 1,
    gap: 4,
  },
  selectionStatusTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  selectionStatusHint: {
    color: "#64748B",
    fontSize: 12,
  },
  selectionClearButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 64,
    paddingHorizontal: 12,
  },
  selectionClearButtonLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
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
  ghostButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  ghostButtonLabel: {
    color: "#334155",
    fontSize: 14,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  stickyStartBar: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  stickyStartCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "#BFDBFE",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  stickyStartTextWrap: {
    flex: 1,
    gap: 2,
  },
  stickyClearButton: {
    minWidth: 82,
  },
  stickyStartTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  stickyStartMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  stickyStartButton: {
    minWidth: 132,
  },
  catalogHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paginationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  questionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  questionCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#ECF3FF",
  },
  questionCardPressed: {
    opacity: 0.85,
  },
  questionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  questionCode: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  questionType: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  questionPreview: {
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 20,
  },
  questionMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  lockedText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "600",
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
  sessionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "75%",
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
  sessionMeta: {
    color: "#64748B",
    fontSize: 12,
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
  helpSheetStepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  helpSheetNumber: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24,
  },
  helpSheetNumberLabel: {
    fontSize: 12,
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
  onboardingHeroCard: {
    backgroundColor: "#EEF4FF",
    borderColor: "#BFDBFE",
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: "800",
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    gap: 14,
    paddingBottom: 4,
  },
});

type FilterChipsProps = {
  title: string;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
};

const FilterChips = ({ title, options, selectedValue, onSelect }: FilterChipsProps) => (
  <View style={styles.filterWrap}>
    <Text style={styles.filterTitle}>{title}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      <Pressable
        style={({ pressed }) => [
          styles.filterChip,
          selectedValue === "all" && styles.filterChipActive,
          pressed && styles.filterChipPressed,
        ]}
        onPress={() => onSelect("all")}
      >
        <Text
          style={[styles.filterChipLabel, selectedValue === "all" && styles.filterChipLabelActive]}
        >
          All
        </Text>
      </Pressable>
      {options.map((option) => (
        <Pressable
          key={`${title}-${option.value}`}
          style={({ pressed }) => [
            styles.filterChip,
            selectedValue === option.value && styles.filterChipActive,
            pressed && styles.filterChipPressed,
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
