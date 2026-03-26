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
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import { MathRichText } from "@/components/ui/math-rich-text";
import { QuestionMediaGallery } from "@/components/ui/question-media-gallery";
import {
  EmptyStateCard,
  InlineErrorState,
  InlineLoadingState,
  PageStateCard,
} from "@/components/ui/state-blocks";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useTranslation } from "@/i18n";
import { useDeleteQuestionPaperMutation } from "../hooks/use-delete-question-paper-mutation";
import { useMarkQuestionPaperExportedMutation } from "../hooks/use-mark-question-paper-exported-mutation";
import { useQuestionPaperDetailQuery } from "../hooks/use-question-paper-detail-query";
import { useQuestionPaperSwapCandidatesQuery } from "../hooks/use-question-paper-swap-candidates-query";
import { useRemoveQuestionPaperItemMutation } from "../hooks/use-remove-question-paper-item-mutation";
import { useReorderQuestionPaperItemsMutation } from "../hooks/use-reorder-question-paper-items-mutation";
import { useSwapQuestionPaperItemMutation } from "../hooks/use-swap-question-paper-item-mutation";
import { useUpdateQuestionPaperMutation } from "../hooks/use-update-question-paper-mutation";
import { useUpdateQuestionPaperStatusMutation } from "../hooks/use-update-question-paper-status-mutation";
import type { QuestionPaperItem } from "../types/papers.types";

type PaperDetailScreenProps = {
  paperId: string;
};

const toQuestionTypeLabelKey = (value: string) => {
  if (value === "mcq") return "papers:questionTypes.mcq";
  if (value === "true_false") return "papers:questionTypes.trueFalse";
  if (value === "short_answer") return "papers:questionTypes.shortAnswer";
  if (value === "long_answer") return "papers:questionTypes.longAnswer";
  if (value === "fill_blank") return "papers:questionTypes.fillBlank";
  if (value === "matching") return "papers:questionTypes.matching";
  return value;
};

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const SkeletonBlock = ({
  animatedValue,
  style,
}: {
  animatedValue: Animated.Value;
  style?: object;
}) => <Animated.View style={[styles.loadingSkeletonBlock, style, { opacity: animatedValue }]} />;

const PaperDetailLoadingState = ({ title }: { title: string }) => {
  const pulse = React.useRef(new Animated.Value(0.42)).current;

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
          toValue: 0.42,
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
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.loadingHeroCard}>
        <View style={styles.loadingHeroTopRow}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingBackPill} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingStatusPill} />
        </View>
        <Text style={styles.loadingHeroLabel}>{title}</Text>
        <View style={styles.loadingHeroCopy}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingLineStrong} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingLineMedium} />
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.loadingMetricCard}>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricLabel} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricValue} />
          </View>
          <View style={styles.loadingMetricCard}>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricLabel} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricValue} />
          </View>
          <View style={styles.loadingMetricCardWide}>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricLabelWide} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingMetricValueWide} />
          </View>
        </View>
      </View>

      <View style={styles.loadingCard}>
        <View style={styles.loadingCardHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingSectionTitle} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingTinyPill} />
        </View>
        <SkeletonBlock animatedValue={pulse} style={styles.loadingLineStrong} />
        <View style={styles.loadingButtonRow}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingPrimaryButton} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingSecondaryButton} />
        </View>
      </View>

      <View style={styles.loadingCard}>
        <SkeletonBlock animatedValue={pulse} style={styles.loadingSectionTitle} />
        <View style={styles.loadingFormGrid}>
          <View style={styles.loadingFormField}>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingInputLabel} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingInput} />
          </View>
          <View style={styles.loadingFormField}>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingInputLabel} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingInput} />
          </View>
        </View>
        <View style={styles.loadingFormField}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingInputLabelWide} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingTextarea} />
        </View>
      </View>

      <View style={styles.loadingCard}>
        <View style={styles.loadingCardHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.loadingSectionTitle} />
          <SkeletonBlock animatedValue={pulse} style={styles.loadingTinyPillWide} />
        </View>
        {[0, 1, 2].map((itemIndex) => (
          <View key={`loading-question-${itemIndex}`} style={styles.loadingQuestionCard}>
            <View style={styles.loadingQuestionHeader}>
              <SkeletonBlock animatedValue={pulse} style={styles.loadingQuestionTitle} />
              <SkeletonBlock animatedValue={pulse} style={styles.loadingQuestionChip} />
            </View>
            <SkeletonBlock animatedValue={pulse} style={styles.loadingLineStrong} />
            <SkeletonBlock animatedValue={pulse} style={styles.loadingLineWide} />
            <View style={styles.loadingButtonRow}>
              <SkeletonBlock animatedValue={pulse} style={styles.loadingActionChip} />
              <SkeletonBlock animatedValue={pulse} style={styles.loadingActionChip} />
              <SkeletonBlock animatedValue={pulse} style={styles.loadingActionChip} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const buildReorderedItemIds = (
  items: QuestionPaperItem[],
  itemId: string,
  direction: "up" | "down",
) => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex < 0) return null;

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return null;

  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(currentIndex, 1);
  reorderedItems.splice(nextIndex, 0, movedItem);
  return reorderedItems.map((item) => item.id);
};

const parseMatchingPairsFromText = (rawValue: string | null | undefined) => {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return {} as Record<string, string>;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>((next, [left, right]) => {
        if (typeof right !== "string") return next;
        const normalizedLeft = left.trim();
        const normalizedRight = right.trim();
        if (!normalizedLeft || !normalizedRight) return next;
        next[normalizedLeft] = normalizedRight;
        return next;
      }, {});
    }
  } catch {
    // Keep plain text fallback below.
  }

  return trimmed.split("|").reduce<Record<string, string>>((next, segment) => {
    const [left, right] = segment.split(":", 2).map((value) => value?.trim() ?? "");
    if (!left || !right) return next;
    next[left] = right;
    return next;
  }, {});
};

const formatPaperAnswerForDisplay = (item: QuestionPaperItem) => {
  if (item.questionType !== "matching") {
    return item.answerText ?? "";
  }

  const optionPairs = item.options
    .map((option) => ({
      left: option.label?.trim() ?? "",
      right: option.text.trim(),
    }))
    .filter((pair) => pair.left.length > 0 && pair.right.length > 0);

  if (optionPairs.length > 0) {
    return optionPairs.map((pair, index) => `${index + 1}. ${pair.left} -> ${pair.right}`).join("\n");
  }

  const parsedPairs = parseMatchingPairsFromText(item.answerText);
  const parsedEntries = Object.entries(parsedPairs);
  if (parsedEntries.length > 0) {
    return parsedEntries
      .map(([left, right], index) => `${index + 1}. ${left} -> ${right}`)
      .join("\n");
  }

  return item.answerText ?? "";
};

export const PaperDetailScreen = ({ paperId }: PaperDetailScreenProps) => {
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
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "remove-item"; itemId: string }
    | { kind: "delete-paper"; paperId: string }
    | { kind: "export-pdf"; paperId: string }
    | null
  >(null);
  const paper = detailQuery.data;
  const isDraft = paper?.status === "draft";
  const canBackToDraft = paper?.status === "finalized" && !paper.exportedAt;

  const swapCandidatesQuery = useQuestionPaperSwapCandidatesQuery(
    paperId,
    swapItemId,
    isDraft,
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
    if (!paper.items.some((item) => item.id === swapItemId)) {
      setSwapItemId(null);
    }
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
    ],
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

  const backToPapers = () => {
    router.replace("/papers" as RelativePathString);
  };

  const saveMetadata = async () => {
    if (!paper || !isDraft || hasActionPending || !title.trim()) {
      return;
    }

    setActionMessage(null);
    try {
      await updateMutation.mutateAsync({
        title: title.trim(),
        instructions: normalizeOptionalText(instructions),
        schoolName: normalizeOptionalText(schoolName),
        academicYear: normalizeOptionalText(academicYear),
        includeAnswerKey,
      });
      setActionMessage(t("papers:detail.saved"));
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.saveFailed"));
    }
  };

  const finalizeOrReopen = async () => {
    if (!paper || hasActionPending) {
      return;
    }

    setActionMessage(null);
    const nextStatus = paper.status === "draft" ? "finalized" : "draft";
    try {
      await statusMutation.mutateAsync(nextStatus);
      setActionMessage(
        nextStatus === "finalized"
          ? t("papers:detail.finalizedMessage")
          : t("papers:detail.draftMessage"),
      );
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.statusFailed"));
    }
  };

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    if (!paper || !isDraft || hasActionPending) {
      return;
    }

    const nextItemIds = buildReorderedItemIds(paper.items, itemId, direction);
    if (!nextItemIds) {
      return;
    }

    setActionMessage(null);
    try {
      await reorderMutation.mutateAsync(nextItemIds);
      setActionMessage(t("papers:detail.orderUpdated"));
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.reorderFailed"));
    }
  };

  const removeItem = (itemId: string) => {
    if (!paper || !isDraft || hasActionPending) {
      return;
    }

    setConfirmAction({ kind: "remove-item", itemId });
  };

  const swapItem = async (itemId: string, candidateQuestionId?: string) => {
    if (!paper || !isDraft || hasActionPending) {
      return;
    }

    setActionMessage(null);
    try {
      await swapMutation.mutateAsync({
        itemId,
        candidateQuestionId,
      });
      setSwapItemId(null);
      setActionMessage(t("papers:detail.replacementApplied"));
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.swapFailed"));
    }
  };

  const requestExportPdf = () => {
    if (!paper || hasActionPending || paper.status !== "finalized") {
      return;
    }

    setConfirmAction({ kind: "export-pdf", paperId: paper.id });
  };

  const markExported = async (targetPaperId: string) => {
    if (!paper || hasActionPending || paper.id !== targetPaperId) {
      return;
    }

    setActionMessage(null);
    try {
      await exportMutation.mutateAsync();
      setActionMessage(t("papers:detail.exportRecorded"));
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.exportFailed"));
    }
  };

  const openPdf = async () => {
    if (!paper?.exportedAt || hasActionPending) {
      return;
    }

    setActionMessage(null);
    router.push(`/papers/preview/${paper.id}` as RelativePathString);
  };

  const deletePaper = () => {
    if (!paper || hasActionPending) {
      return;
    }

    setConfirmAction({ kind: "delete-paper", paperId: paper.id });
  };

  const confirmPaperAction = async () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.kind === "remove-item") {
      setActionMessage(null);
      try {
        await removeItemMutation.mutateAsync(confirmAction.itemId);
        setSwapItemId((currentItemId) =>
          currentItemId === confirmAction.itemId ? null : currentItemId,
        );
        setActionMessage(t("papers:detail.removed"));
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : t("papers:detail.removeFailed"));
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
      setActionMessage(error instanceof Error ? error.message : t("papers:detail.deleteFailed"));
      setConfirmAction(null);
    }
  };

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.headerBackButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={backToPapers}
            >
              <Text style={styles.secondaryButtonLabel}>{t("papers:detail.back")}</Text>
            </Pressable>
            <Text
              style={[
                styles.exportStatusPill,
                paper.exportedAt
                  ? styles.exportStatusPillReady
                  : paper.status === "finalized"
                    ? styles.exportStatusPillPending
                    : styles.exportStatusPillDraft,
              ]}
            >
              {paper.exportedAt ? t("papers:status.pdfReady") : t(`papers:status.${paper.status}`)}
            </Text>
          </View>
          <Text style={styles.heading}>{paper.title}</Text>
          <Text style={styles.metaText}>
            {t("papers:detail.statusLine", {
              status: paper.exportedAt ? t("papers:status.exported") : t(`papers:status.${paper.status}`),
              questions: paper.totalQuestions,
              marks: paper.totalMarks,
            })}
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{t("papers:detail.questions")}</Text>
              <Text style={styles.metricValue}>{paper.totalQuestions}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{t("papers:home.totalMarks")}</Text>
              <Text style={styles.metricValue}>{paper.totalMarks}</Text>
            </View>
            <View style={styles.metricCardWide}>
              <Text style={styles.metricLabel}>{t("papers:detail.updated", { value: "" }).split(":")[0]}</Text>
              <Text style={styles.metricValueSmall}>{formatDateTime(paper.updatedAt)}</Text>
            </View>
          </View>
          {paper.exportedAt ? (
            <Text style={styles.metaText}>
              {t("papers:detail.exported", { value: formatDateTime(paper.exportedAt) })}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            {isDraft ? (
              <Pressable
                disabled={hasActionPending || !metadataDirty || !title.trim()}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.actionButton,
                  (hasActionPending || !metadataDirty || !title.trim()) && styles.buttonDisabled,
                  pressed && metadataDirty && title.trim() && styles.buttonPressed,
                ]}
                onPress={saveMetadata}
              >
                <Text style={styles.secondaryButtonLabel}>{t("papers:detail.saveDraft")}</Text>
              </Pressable>
            ) : null}

            <Pressable
              disabled={hasActionPending || (!isDraft && !canBackToDraft)}
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.actionButton,
                (hasActionPending || (!isDraft && !canBackToDraft)) && styles.buttonDisabled,
                pressed && !hasActionPending && styles.buttonPressed,
              ]}
              onPress={finalizeOrReopen}
            >
              <Text style={styles.secondaryButtonLabel}>
                {paper.status === "draft" ? t("papers:detail.finalize") : t("papers:detail.backToDraft")}
              </Text>
            </Pressable>

          </View>

          <Pressable
            disabled={hasActionPending}
            style={({ pressed }) => [
              styles.deleteButton,
              hasActionPending && styles.buttonDisabled,
              pressed && !hasActionPending && styles.buttonPressed,
            ]}
            onPress={deletePaper}
          >
            <Text style={styles.deleteButtonLabel}>{t("papers:detail.deletePaper")}</Text>
          </Pressable>

          {actionMessage ? (
            actionMessage.toLowerCase().includes("failed") ? (
              <InlineErrorState message={actionMessage} />
            ) : (
              <Text style={styles.actionMessage}>{actionMessage}</Text>
            )
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("papers:detail.export")}</Text>
          <View style={styles.exportStatusCard}>
            <View style={styles.exportStatusHeader}>
              <Text style={styles.exportStatusTitle}>{exportStateLabel}</Text>
              <Text
                style={[
                  styles.exportStatusPill,
                  paper.exportedAt
                    ? styles.exportStatusPillReady
                    : paper.status === "finalized"
                      ? styles.exportStatusPillPending
                      : styles.exportStatusPillDraft,
                ]}
              >
                {paper.exportedAt ? t("papers:status.pdfReady") : t(`papers:status.${paper.status}`)}
              </Text>
            </View>
            <Text style={styles.sectionHint}>{exportStateHint}</Text>
            <Text style={styles.metaText}>
              {paper.includeAnswerKey ? t("papers:detail.answerKeyIncluded") : t("papers:detail.answerKeyHidden")}
            </Text>
            <Text style={styles.metaText}>{t("papers:detail.lastExport", { value: formatDateTime(paper.exportedAt) })}</Text>
          </View>

          <View style={styles.buttonColumn}>
            <Pressable
              disabled={hasActionPending || paper.status !== "finalized"}
              style={({ pressed }) => [
                styles.primaryButton,
                (hasActionPending || paper.status !== "finalized") && styles.buttonDisabled,
                pressed && paper.status === "finalized" && styles.buttonPressed,
              ]}
              onPress={requestExportPdf}
            >
              {exportMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonLabel}>
                  {paper.exportedAt ? t("papers:detail.regeneratePdfExport") : t("papers:detail.generatePdfExport")}
                </Text>
              )}
            </Pressable>

            {paper.exportedAt ? (
              <>
                <View style={styles.previewCard}>
                  <Text style={styles.previewCardTitle}>{t("papers:detail.protectedPreviewTitle")}</Text>
                  <Text style={styles.sectionHint}>{t("papers:detail.protectedPreviewHint")}</Text>
                  <Pressable
                    disabled={hasActionPending}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      hasActionPending && styles.buttonDisabled,
                      pressed && !hasActionPending && styles.buttonPressed,
                    ]}
                    onPress={openPdf}
                  >
                    <Text style={styles.secondaryButtonLabel}>{t("papers:detail.previewPdfInApp")}</Text>
                  </Pressable>
                </View>

              </>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("papers:detail.paperDetails")}</Text>
          <Text style={styles.sectionHint}>
            {isDraft
              ? t("papers:detail.draftEditable")
              : t("papers:detail.finalizedReadonly")}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("papers:detail.title")}</Text>
            <TextInput
              editable={isDraft && !hasActionPending}
              placeholder={t("papers:detail.titlePlaceholder")}
              placeholderTextColor="#94A3B8"
              style={[styles.input, !isDraft && styles.inputDisabled]}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("papers:detail.instructions")}</Text>
            <TextInput
              editable={isDraft && !hasActionPending}
              multiline
              numberOfLines={4}
              placeholder={t("papers:detail.instructionsPlaceholder")}
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.multilineInput, !isDraft && styles.inputDisabled]}
              textAlignVertical="top"
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formHalf]}>
              <Text style={styles.label}>{t("papers:detail.schoolName")}</Text>
              <TextInput
                editable={isDraft && !hasActionPending}
                placeholder={t("papers:detail.optional")}
                placeholderTextColor="#94A3B8"
                style={[styles.input, !isDraft && styles.inputDisabled]}
                value={schoolName}
                onChangeText={setSchoolName}
              />
            </View>

            <View style={[styles.formGroup, styles.formHalf]}>
              <Text style={styles.label}>{t("papers:detail.academicYear")}</Text>
              <TextInput
                editable={isDraft && !hasActionPending}
                placeholder="2025-2026"
                placeholderTextColor="#94A3B8"
                style={[styles.input, !isDraft && styles.inputDisabled]}
                value={academicYear}
                onChangeText={setAcademicYear}
              />
            </View>
          </View>

          <Pressable
            disabled={!isDraft || hasActionPending}
            style={({ pressed }) => [
              styles.checkboxRow,
              includeAnswerKey && styles.checkboxRowActive,
              (!isDraft || hasActionPending) && styles.buttonDisabled,
              pressed && isDraft && styles.buttonPressed,
            ]}
            onPress={() => setIncludeAnswerKey((value) => !value)}
          >
            <Text style={styles.checkboxLabel}>
              {includeAnswerKey ? "✓ " : ""}{t("papers:home.includeAnswerKey")}
            </Text>
          </Pressable>

          <View style={styles.metaGrid}>
            <Text style={styles.metaText}>
              {t("papers:detail.grade", { value: paper.grade ? `${paper.grade.name} (${paper.grade.code})` : t("papers:detail.notSet") })}
            </Text>
            <Text style={styles.metaText}>
              {t("papers:detail.subject", { value: paper.subject ? `${paper.subject.name} (${paper.subject.code})` : t("papers:detail.notSet") })}
            </Text>
            <Text style={styles.metaText}>
              {t("papers:detail.chapter", { value: paper.chapter ? paper.chapter.name : t("papers:detail.notSet") })}
            </Text>
            <Text style={styles.metaText}>
              {t("papers:detail.subchapter", { value: paper.subChapter ? paper.subChapter.name : t("papers:detail.notSet") })}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("papers:detail.questions")}</Text>
          <Text style={styles.sectionHint}>
            {isDraft
              ? t("papers:detail.draftQuestionHint")
              : t("papers:detail.finalizedQuestionHint")}
          </Text>

          {paper.items.length === 0 ? (
            <EmptyStateCard title={t("papers:detail.noQuestions")} />
          ) : null}

          {paper.items.map((item, index) => {
            const isSwapPanelOpen = swapItemId === item.id;
            const swapCandidates = isSwapPanelOpen ? swapCandidatesQuery.data?.rows ?? [] : [];
            const answerDisplay = formatPaperAnswerForDisplay(item).trim();

            return (
              <View key={item.id} style={styles.questionCard}>
                <View style={styles.questionHeadingRow}>
                  <Text style={styles.questionCode}>Q{item.position}</Text>
                  <View style={styles.questionMetaPills}>
                    <Text style={styles.questionMetaPill}>
                      {t(toQuestionTypeLabelKey(item.questionType))}
                    </Text>
                    <Text style={styles.questionMetaPill}>
                      {item.marks} {item.marks === 1 ? "mark" : "marks"}
                    </Text>
                  </View>
                </View>

                <MathRichText content={item.body} textStyle={styles.questionBody} />
                <QuestionMediaGallery imageUrls={item.questionImageUrls} />

                {answerDisplay && includeAnswerKey ? (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerPrefix}>{t("papers:detail.answer")}</Text>
                    <MathRichText content={answerDisplay} textStyle={styles.answerText} />
                    <QuestionMediaGallery imageUrls={item.solutionImageUrls} />
                  </View>
                ) : null}

                {isDraft ? (
                  <View style={styles.itemActionRow}>
                    <Pressable
                      disabled={hasActionPending || index === 0}
                      style={({ pressed }) => [
                        styles.smallButton,
                        (hasActionPending || index === 0) && styles.buttonDisabled,
                        pressed && index > 0 && styles.buttonPressed,
                      ]}
                      onPress={() => moveItem(item.id, "up")}
                    >
                      <Text style={styles.smallButtonLabel}>{t("papers:detail.moveUp")}</Text>
                    </Pressable>

                    <Pressable
                      disabled={hasActionPending || index === paper.items.length - 1}
                      style={({ pressed }) => [
                        styles.smallButton,
                        (hasActionPending || index === paper.items.length - 1) &&
                          styles.buttonDisabled,
                        pressed && index < paper.items.length - 1 && styles.buttonPressed,
                      ]}
                      onPress={() => moveItem(item.id, "down")}
                    >
                      <Text style={styles.smallButtonLabel}>{t("papers:detail.moveDown")}</Text>
                    </Pressable>

                    <Pressable
                      disabled={hasActionPending}
                      style={({ pressed }) => [
                        styles.smallButton,
                        isSwapPanelOpen && styles.smallButtonActive,
                        hasActionPending && styles.buttonDisabled,
                        pressed && !hasActionPending && styles.buttonPressed,
                      ]}
                      onPress={() =>
                        setSwapItemId((currentValue) =>
                          currentValue === item.id ? null : item.id,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.smallButtonLabel,
                          isSwapPanelOpen && styles.smallButtonLabelActive,
                        ]}
                      >
                        {t("papers:detail.replace")}
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={hasActionPending}
                      style={({ pressed }) => [
                        styles.smallButton,
                        styles.dangerSmallButton,
                        hasActionPending && styles.buttonDisabled,
                        pressed && !hasActionPending && styles.buttonPressed,
                      ]}
                      onPress={() => removeItem(item.id)}
                    >
                      <Text style={styles.dangerSmallButtonLabel}>{t("papers:home.remove")}</Text>
                    </Pressable>
                  </View>
                ) : null}

                {isDraft && isSwapPanelOpen ? (
                  <View style={styles.swapPanel}>
                    <Text style={styles.swapPanelTitle}>{t("papers:detail.replacementCandidates")}</Text>
                    {swapCandidatesQuery.isLoading ? (
                      <InlineLoadingState label={t("papers:detail.loadingReplacements")} />
                    ) : null}
                    {swapCandidatesQuery.isError ? (
                      <InlineErrorState
                        message={
                          swapCandidatesQuery.error instanceof Error
                            ? swapCandidatesQuery.error.message
                            : t("papers:detail.failedReplacements")
                        }
                      />
                    ) : null}
                    {!swapCandidatesQuery.isLoading &&
                    !swapCandidatesQuery.isError &&
                    swapCandidates.length === 0 ? (
                      <EmptyStateCard title={t("papers:detail.noReplacements")} />
                    ) : null}
                    {swapCandidates.map((candidate) => (
                      <View key={candidate.id} style={styles.candidateCard}>
                        <Text style={styles.candidateHeading}>
                          {candidate.questionCode} • {t(toQuestionTypeLabelKey(candidate.type))} •{" "}
                          {candidate.marks} marks
                        </Text>
                        <MathRichText
                          content={candidate.bodyPreview}
                          renderMode="auto"
                          textStyle={styles.candidateBody}
                        />
                        <Text style={styles.metaText}>
                          {candidate.subject.name}
                          {candidate.chapter ? ` • ${candidate.chapter.name}` : ""}
                        </Text>
                        <Pressable
                          disabled={hasActionPending}
                          style={({ pressed }) => [
                            styles.smallPrimaryButton,
                            hasActionPending && styles.buttonDisabled,
                            pressed && !hasActionPending && styles.buttonPressed,
                          ]}
                          onPress={() => swapItem(item.id, candidate.id)}
                        >
                          <Text style={styles.smallPrimaryButtonLabel}>{t("papers:detail.useThisQuestion")}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ConfirmationSheet
        visible={Boolean(confirmAction)}
        title={
          confirmAction?.kind === "delete-paper"
            ? t("papers:detail.deletePaper")
            : confirmAction?.kind === "export-pdf"
              ? t("papers:detail.exportConfirmTitle")
              : t("papers:detail.removeQuestion")
        }
        message={
          confirmAction?.kind === "delete-paper"
            ? t("papers:detail.deleteMessage")
            : confirmAction?.kind === "export-pdf"
              ? t("papers:detail.exportConfirmMessage")
              : t("papers:detail.removeMessage")
        }
        hint={
          confirmAction?.kind === "delete-paper"
            ? t("papers:detail.deleteHint")
            : confirmAction?.kind === "export-pdf"
              ? t("papers:detail.exportConfirmHint")
              : t("papers:detail.removeHint")
        }
        confirmLabel={
          confirmAction?.kind === "delete-paper"
            ? t("papers:detail.deletePaper")
            : confirmAction?.kind === "export-pdf"
              ? t("papers:detail.generatePdfExport")
              : t("papers:detail.removeQuestion")
        }
        confirmTone={confirmAction?.kind === "delete-paper" ? "danger" : "primary"}
        isPending={
          removeItemMutation.isPending || deleteMutation.isPending || exportMutation.isPending
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
  loadingHeroCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    overflow: "hidden",
    padding: 16,
  },
  loadingHeroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingHeroLabel: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
  },
  loadingHeroCopy: {
    gap: 10,
  },
  loadingSkeletonBlock: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
  },
  loadingBackPill: {
    height: 38,
    width: 92,
  },
  loadingStatusPill: {
    height: 28,
    width: 88,
  },
  loadingLineStrong: {
    height: 16,
    width: "72%",
  },
  loadingLineMedium: {
    height: 12,
    width: "54%",
  },
  loadingLineWide: {
    height: 12,
    width: "92%",
  },
  loadingMetricCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingMetricCardWide: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    gap: 10,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingMetricLabel: {
    height: 10,
    width: "58%",
  },
  loadingMetricLabelWide: {
    height: 10,
    width: "42%",
  },
  loadingMetricValue: {
    height: 18,
    width: "44%",
  },
  loadingMetricValueWide: {
    height: 14,
    width: "74%",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  loadingCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingSectionTitle: {
    height: 16,
    width: "38%",
  },
  loadingTinyPill: {
    height: 24,
    width: 70,
  },
  loadingTinyPillWide: {
    height: 24,
    width: 108,
  },
  loadingButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loadingPrimaryButton: {
    height: 42,
    width: 148,
  },
  loadingSecondaryButton: {
    height: 42,
    width: 112,
  },
  loadingFormGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  loadingFormField: {
    flex: 1,
    gap: 8,
    minWidth: 140,
  },
  loadingInputLabel: {
    height: 10,
    width: "34%",
  },
  loadingInputLabelWide: {
    height: 10,
    width: "22%",
  },
  loadingInput: {
    borderRadius: 12,
    height: 46,
    width: "100%",
  },
  loadingTextarea: {
    borderRadius: 14,
    height: 108,
    width: "100%",
  },
  loadingQuestionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  loadingQuestionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingQuestionTitle: {
    height: 14,
    width: "48%",
  },
  loadingQuestionChip: {
    height: 24,
    width: 74,
  },
  loadingActionChip: {
    height: 34,
    width: 84,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  heading: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerBackButton: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    color: "#64748B",
    fontSize: 12,
  },
  metaText: {
    color: "#475569",
    fontSize: 12,
  },
  metaGrid: {
    gap: 4,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metricCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCardWide: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  metricValueSmall: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  exportStatusCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  exportStatusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  exportStatusTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  exportStatusPill: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "capitalize",
  },
  exportStatusPillReady: {
    backgroundColor: "#DCFCE7",
    color: "#047857",
  },
  exportStatusPillPending: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
  },
  exportStatusPillDraft: {
    backgroundColor: "#E2E8F0",
    color: "#475569",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  buttonColumn: {
    gap: 8,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 100,
  },
  previewCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  previewCardTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formGroup: {
    gap: 6,
  },
  formHalf: {
    flex: 1,
    minWidth: 140,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 100,
  },
  inputDisabled: {
    color: "#64748B",
  },
  checkboxRow: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  checkboxRowActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
  },
  checkboxLabel: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#FECACA",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 2,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  deleteButtonLabel: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
  questionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  questionHeadingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  questionCode: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  questionMetaPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  questionMetaPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  questionBody: {
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 20,
  },
  answerText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  answerRow: {
    gap: 2,
  },
  answerPrefix: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },
  itemActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  smallButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 82,
    paddingHorizontal: 10,
  },
  smallButtonActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
  },
  smallButtonLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  smallButtonLabelActive: {
    color: "#1D4ED8",
  },
  dangerSmallButton: {
    borderColor: "#FECACA",
  },
  dangerSmallButtonLabel: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
  smallPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10,
  },
  smallPrimaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  swapPanel: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
  },
  swapPanelTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  candidateCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  candidateHeading: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  candidateBody: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  actionMessage: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});
