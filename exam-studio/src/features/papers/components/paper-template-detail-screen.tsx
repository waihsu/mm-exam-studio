import { useRouter, type RelativePathString } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { InlineErrorState, PageStateCard } from "@/components/ui/state-blocks";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTranslation } from "@/i18n";
import { useMaterializePaperTemplateMutation } from "../hooks/use-materialize-paper-template-mutation";
import { usePaperTemplateDetailQuery } from "../hooks/use-paper-template-detail-query";
import type {
  PaperQuestionType,
  PaperTemplateSection,
  PaperTemplateSlot,
} from "../types/papers.types";

type PaperTemplateDetailScreenProps = {
  templateId: string;
};

const templateModeLabel = (mode: "custom" | "mcq_only" | "all_type") => {
  if (mode === "mcq_only") return "MCQ only";
  if (mode === "all_type") return "All type";
  return "Custom";
};

const toQuestionTypeLabel = (
  value: PaperQuestionType | null | undefined,
  t: (key: string) => string,
) => {
  if (!value) return t("papers:questionTypes.all");
  if (value === "mcq") return t("papers:questionTypes.mcq");
  if (value === "true_false") return t("papers:questionTypes.trueFalse");
  if (value === "short_answer") return t("papers:questionTypes.shortAnswer");
  if (value === "long_answer") return t("papers:questionTypes.longAnswer");
  if (value === "fill_blank") return t("papers:questionTypes.fillBlank");
  return t("papers:questionTypes.matching");
};

const formatSectionLine = (
  section: PaperTemplateSection,
  t: (key: string, params?: Record<string, unknown>) => string,
) =>
  t("papers:templates.sectionSummary", {
    count: section.questionCount,
    type: toQuestionTypeLabel(section.questionType, t),
    marks: section.totalMarks,
  });

const formatSlotLine = (
  slot: PaperTemplateSlot,
  t: (key: string, params?: Record<string, unknown>) => string,
) => {
  const difficulty = slot.difficultyTarget
    ? t(`papers:templates.difficulty.${slot.difficultyTarget}`)
    : t("papers:templates.difficulty.any");
  const scope = slot.subChapter?.name ?? slot.chapter?.name ?? t("papers:templates.scopeAny");

  return t("papers:templates.slotSummary", {
    slot: slot.slotNumber,
    type: toQuestionTypeLabel(slot.questionType, t),
    marks: slot.marks,
    difficulty,
    scope,
  });
};

const TemplateSkeletonBlock = ({
  animatedValue,
  style,
}: {
  animatedValue: Animated.Value;
  style?: object;
}) => <Animated.View style={[styles.loadingSkeletonBlock, style, { opacity: animatedValue }]} />;

const PaperTemplateDetailLoadingState = () => {
  const pulse = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.4,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulse]);

  return (
    <>
      <View style={styles.loadingCard}>
        <View style={styles.loadingHeaderRow}>
          <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingTitle} />
          <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingPill} />
        </View>
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingMeta} />
        <View style={styles.metricRow}>
          {[0, 1, 2].map((index) => (
            <View key={`template-metric-${index}`} style={styles.loadingMetricChip}>
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingMetricLabel} />
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingMetricValue} />
            </View>
          ))}
        </View>
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingMetaWide} />
      </View>

      <View style={styles.loadingCard}>
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingSectionHeading} />
        <View style={styles.difficultyGrid}>
          {[0, 1, 2, 3].map((index) => (
            <View key={`difficulty-${index}`} style={styles.loadingDifficultyChip}>
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingDifficultyLabel} />
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingDifficultyValue} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.loadingCard}>
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingSectionHeading} />
        {[0, 1, 2].map((index) => (
          <View key={`section-${index}`} style={styles.loadingListRow}>
            <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingBadge} />
            <View style={styles.loadingListBody}>
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingLineStrong} />
              <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingLineSoft} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.loadingCard}>
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingSectionHeading} />
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingInputLabel} />
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingInput} />
        <TemplateSkeletonBlock animatedValue={pulse} style={styles.loadingButton} />
      </View>
    </>
  );
};

export const PaperTemplateDetailScreen = ({
  templateId,
}: PaperTemplateDetailScreenProps) => {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const detailQuery = usePaperTemplateDetailQuery(templateId);
  const materializeMutation = useMaterializePaperTemplateMutation();
  const [title, setTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const template = detailQuery.data;
  useEffect(() => {
    if (template && !title.trim()) {
      setTitle(template.title);
    }
  }, [template, title]);

  const scopeSummary = useMemo(() => {
    if (!template) return null;

    const chapterCount = template.presetConfig.chapterIds?.length ?? 0;
    const lessonCount = template.presetConfig.subChapterIds?.length ?? 0;

    if (chapterCount < 1 && lessonCount < 1) {
      return t("papers:templates.fullCurriculum");
    }

    return t("papers:templates.scopeSummary", {
      chapters: chapterCount,
      lessons: lessonCount,
    });
  }, [detailQuery.data, t]);

  const createFromTemplate = async () => {
    if (!template || !title.trim() || materializeMutation.isPending) {
      return;
    }

    setActionError(null);
    try {
      const created = await materializeMutation.mutateAsync({
        templateId: template.id,
        input: { title: title.trim() },
      });
      router.replace(`/papers/${created.id}` as RelativePathString);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("papers:home.failedCreate"),
      );
    }
  };

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonLabel}>{t("papers:templates.backToCatalog")}</Text>
            </Pressable>
            {template ? (
              <View style={styles.planPill}>
                <Text style={styles.planPillLabel}>
                  {t("papers:templates.planShort", {
                    plan: template.access.planCode.toUpperCase(),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heading}>{t("papers:templates.detailTitle")}</Text>
          <Text style={styles.subheading}>{t("papers:templates.detailSubtitle")}</Text>
        </View>

        {detailQuery.isLoading ? <PaperTemplateDetailLoadingState /> : null}

        {detailQuery.isError ? (
          <PageStateCard
            title={t("papers:templates.failedDetail")}
            hint={
              detailQuery.error instanceof Error
                ? detailQuery.error.message
                : t("papers:templates.failedDetail")
            }
            actionLabel={t("papers:templates.backToCatalog")}
            onAction={() => router.back()}
          />
        ) : null}

        {template ? (
          <>
            <View style={styles.card}>
              <View style={styles.templateHeadingRow}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.statusPill}>{templateModeLabel(template.mode)}</Text>
              </View>
              <Text style={styles.templateMeta}>{template.grade.name} • {template.subject.name}</Text>
              <View style={styles.metricRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricLabel}>{t("papers:templates.metrics.sections")}</Text>
                  <Text style={styles.metricValue}>{template.sectionCount}</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricLabel}>{t("papers:templates.metrics.slots")}</Text>
                  <Text style={styles.metricValue}>{template.slotCount}</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricLabel}>{t("papers:templates.metrics.marks")}</Text>
                  <Text style={styles.metricValue}>{template.totalMarks}</Text>
                </View>
              </View>
              <Text style={styles.metaMuted}>
                {template.includeAnswerPaper
                  ? t("papers:templates.includesAnswerPaperShort")
                  : t("papers:templates.questionOnlyShort")}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("papers:templates.scopeTitle")}</Text>
              <Text style={styles.metaText}>{scopeSummary}</Text>
              <View style={styles.difficultyGrid}>
                <View style={styles.difficultyChip}>
                  <Text style={styles.difficultyLabel}>
                    {t("papers:templates.difficulty.easy")}
                  </Text>
                  <Text style={styles.difficultyValue}>
                    {template.difficultyDistribution.easy}%
                  </Text>
                </View>
                <View style={styles.difficultyChip}>
                  <Text style={styles.difficultyLabel}>
                    {t("papers:templates.difficulty.normal")}
                  </Text>
                  <Text style={styles.difficultyValue}>
                    {template.difficultyDistribution.normal}%
                  </Text>
                </View>
                <View style={styles.difficultyChip}>
                  <Text style={styles.difficultyLabel}>
                    {t("papers:templates.difficulty.hard")}
                  </Text>
                  <Text style={styles.difficultyValue}>
                    {template.difficultyDistribution.hard}%
                  </Text>
                </View>
                <View style={styles.difficultyChip}>
                  <Text style={styles.difficultyLabel}>
                    {t("papers:templates.difficulty.advance")}
                  </Text>
                  <Text style={styles.difficultyValue}>
                    {template.difficultyDistribution.advance}%
                  </Text>
                </View>
              </View>
            </View>

            {template.sections.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t("papers:templates.sectionsTitle")}</Text>
                <View style={styles.listBlock}>
                  {template.sections.map((section) => (
                    <View key={section.id} style={styles.listRow}>
                      <View style={styles.listBadge}>
                        <Text style={styles.listBadgeLabel}>{section.code}</Text>
                      </View>
                      <View style={styles.listBody}>
                        <Text style={styles.listTitle}>
                          {section.title || t("papers:templates.sectionFallback")}
                        </Text>
                        <Text style={styles.listMeta}>{formatSectionLine(section, t)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {template.mode === "custom" && template.slots.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t("papers:templates.slotsTitle")}</Text>
                <View style={styles.listBlock}>
                  {template.slots.map((slot) => (
                    <View key={slot.id} style={styles.slotRow}>
                      <Text style={styles.slotText}>{formatSlotLine(slot, t)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("papers:templates.useTitle")}</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("papers:home.paperTitle")}</Text>
                <TextInput
                  placeholder={t("papers:home.paperTitlePlaceholder")}
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              {actionError ? <InlineErrorState message={actionError} /> : null}
              <Pressable
                disabled={materializeMutation.isPending || !title.trim()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (materializeMutation.isPending || !title.trim()) && styles.buttonDisabled,
                  pressed &&
                    !materializeMutation.isPending &&
                    title.trim() &&
                    styles.buttonPressed,
                ]}
                onPress={() => {
                  void createFromTemplate();
                }}
              >
                <Text style={styles.primaryButtonLabel}>
                  {materializeMutation.isPending
                    ? t("papers:templates.creating")
                    : t("papers:home.useTemplate")}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  loadingSkeletonBlock: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  loadingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingTitle: {
    height: 20,
    width: "52%",
  },
  loadingPill: {
    height: 28,
    width: 88,
  },
  loadingMeta: {
    height: 12,
    width: "46%",
  },
  loadingMetaWide: {
    height: 12,
    width: "68%",
  },
  loadingMetricChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingMetricLabel: {
    height: 10,
    width: "58%",
  },
  loadingMetricValue: {
    height: 18,
    width: "38%",
  },
  loadingSectionHeading: {
    height: 16,
    width: "34%",
  },
  loadingDifficultyChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    minWidth: 136,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingDifficultyLabel: {
    height: 10,
    width: "62%",
  },
  loadingDifficultyValue: {
    height: 15,
    width: "44%",
  },
  loadingListRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  loadingBadge: {
    borderRadius: 12,
    height: 42,
    width: 42,
  },
  loadingListBody: {
    flex: 1,
    gap: 8,
  },
  loadingLineStrong: {
    height: 14,
    width: "56%",
  },
  loadingLineSoft: {
    height: 12,
    width: "78%",
  },
  loadingInputLabel: {
    height: 10,
    width: "24%",
  },
  loadingInput: {
    borderRadius: 16,
    height: 52,
    width: "100%",
  },
  loadingButton: {
    borderRadius: 16,
    height: 48,
    width: "100%",
  },
  headerBlock: {
    gap: 8,
    marginTop: 8,
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignSelf: "flex-start",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
  },
  subheading: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  templateHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  templateTitle: {
    color: "#111827",
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  statusPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  templateMeta: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  metaText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  metaMuted: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  difficultyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  difficultyChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 136,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  difficultyLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  difficultyValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  listBlock: {
    gap: 12,
  },
  listRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  listBadge: {
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
  },
  listBadgeLabel: {
    color: "#3730A3",
    fontSize: 14,
    fontWeight: "800",
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  listMeta: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  slotRow: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  slotText: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  planPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planPillLabel: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
