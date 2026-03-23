import { useRouter, type RelativePathString } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MathRichText } from "@/components/ui/math-rich-text";
import { AppShell } from "@/features/app-shell/components/app-shell";
import {
  clearPracticeDraft,
  loadPracticeDraft,
  savePracticeDraft,
} from "../services/practice-draft-store";
import {
  clearPracticeReminderNotification as clearScheduledPracticeReminder,
  syncPracticeReminderNotification as syncScheduledPracticeReminder,
} from "../services/practice-reminder-notification.service";
import { usePracticeSessionDetailQuery } from "../hooks/use-practice-session-detail-query";
import { useSubmitPracticeSessionMutation } from "../hooks/use-submit-practice-session-mutation";
import type { PracticeSessionItem } from "../types/practice.types";
import {
  parseMatchingAnswer,
  stringifyMatchingAnswer,
} from "../utils/matching-answer";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";

type PracticeSessionScreenProps = {
  sessionId: string;
};

const toQuestionTypeLabel = (
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (value === "mcq") return t("session.questionTypes.mcq");
  if (value === "true_false") return t("session.questionTypes.true_false");
  if (value === "short_answer") return t("session.questionTypes.short_answer");
  if (value === "long_answer") return t("session.questionTypes.long_answer");
  if (value === "fill_blank") return t("session.questionTypes.fill_blank");
  if (value === "matching") return t("session.questionTypes.matching");
  return value;
};

const formatElapsed = (startedAt: string, nowTs: number) => {
  const deltaSeconds = Math.max(0, Math.floor((nowTs - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(deltaSeconds / 60);
  const seconds = deltaSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

const getMatchingLeftKeys = (item: PracticeSessionItem) => {
  if (item.questionType !== "matching") {
    return [] as string[];
  }

  const keys = item.options.map(
    (option, index) => option.label?.trim() || `Item ${index + 1}`,
  );
  return Array.from(new Set(keys));
};

const isItemAnswered = (item: PracticeSessionItem, rawAnswer: string) => {
  const answer = rawAnswer.trim();
  if (item.questionType !== "matching") {
    return answer.length > 0;
  }

  const leftKeys = getMatchingLeftKeys(item);
  if (leftKeys.length === 0) {
    return answer.length > 0;
  }

  const pairs = parseMatchingAnswer(answer);
  return leftKeys.every((left) => Boolean(pairs[left]?.trim()));
};

const formatMatchingAnswerForDisplay = (
  rawValue: string | null | undefined,
  leftKeys: string[],
) => {
  const pairs = parseMatchingAnswer(rawValue);
  const orderedPairs: Array<{ left: string; right: string }> = [];
  const seenLeft = new Set<string>();

  for (const left of leftKeys) {
    const right = pairs[left]?.trim();
    if (!right) {
      continue;
    }
    orderedPairs.push({ left, right });
    seenLeft.add(left.trim().toLowerCase());
  }

  for (const [left, rightRaw] of Object.entries(pairs)) {
    const right = rightRaw.trim();
    if (!right) {
      continue;
    }
    if (seenLeft.has(left.trim().toLowerCase())) {
      continue;
    }
    orderedPairs.push({ left, right });
  }

  if (orderedPairs.length === 0) {
    const fallback = String(rawValue ?? "").trim();
    return fallback || "-";
  }

  return orderedPairs.map((pair, index) => `${index + 1}. ${pair.left} -> ${pair.right}`).join("\n");
};

export const PracticeSessionScreen = ({ sessionId }: PracticeSessionScreenProps) => {
  const { t } = useTranslation("practice");
  const router = useRouter();
  const { formatDateTime, settings } = useAppDateTimeFormatter();
  const sessionQuery = usePracticeSessionDetailQuery(sessionId);
  const submitMutation = useSubmitPracticeSessionMutation(sessionId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [draftReady, setDraftReady] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const autoSavePracticeDrafts = settings.autoSavePracticeDrafts;
  const confirmBeforeSubmitPractice = settings.confirmBeforeSubmitPractice;
  const practiceReminderEnabled = settings.practiceReminderEnabled;
  const practiceReminderMinutes = settings.practiceReminderMinutes;

  useEffect(() => {
    setAnswers({});
    setCurrentIndex(0);
    setDraftReady(false);
    setShowSubmitSuccess(false);
  }, [sessionId]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const serverAnswers = session.items.reduce<Record<string, string>>((next, item) => {
        next[item.id] = item.submittedAnswer ?? "";
        return next;
      }, {});

      if (session.status === "completed") {
        await clearPracticeDraft(sessionId).catch(() => undefined);
        if (cancelled) return;
        setAnswers(serverAnswers);
        setCurrentIndex(0);
        setDraftReady(true);
        return;
      }

      if (!autoSavePracticeDrafts) {
        if (cancelled) return;
        const firstIncompleteIndex = session.items.findIndex((item) => {
          const answer = serverAnswers[item.id] ?? "";
          return !isItemAnswered(item, answer);
        });
        setAnswers(serverAnswers);
        setCurrentIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
        setDraftReady(true);
        return;
      }

      const draftAnswers = await loadPracticeDraft(sessionId).catch(
        () => ({} as Record<string, string>),
      );
      if (cancelled) return;

      const allowedItemIds = new Set(session.items.map((item) => item.id));
      const mergedAnswers = { ...serverAnswers, ...draftAnswers };
      const filteredAnswers = Object.entries(mergedAnswers).reduce<Record<string, string>>(
        (next, [itemId, value]) => {
          if (!allowedItemIds.has(itemId)) {
            return next;
          }
          next[itemId] = value;
          return next;
        },
        {},
      );

      const firstIncompleteIndex = session.items.findIndex((item) => {
        const answer = filteredAnswers[item.id] ?? "";
        return !isItemAnswered(item, answer);
      });

      setAnswers(filteredAnswers);
      setCurrentIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
      setDraftReady(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [autoSavePracticeDrafts, sessionId, sessionQuery.data]);

  useEffect(() => {
    setNowTs(Date.now());
  }, [sessionQuery.data?.startedAt]);

  useEffect(() => {
    if (!sessionQuery.data || sessionQuery.data.status === "completed") {
      return;
    }

    const intervalId = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionQuery.data]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) {
      return;
    }

    if (session.status === "completed" || !practiceReminderEnabled) {
      void clearScheduledPracticeReminder(sessionId);
      return;
    }

    void syncScheduledPracticeReminder({
      sessionId,
      startedAt: session.startedAt,
      title: session.title.trim() || "Practice Session",
      enabled: practiceReminderEnabled,
      minutes: practiceReminderMinutes,
    }).catch(() => undefined);
  }, [
    practiceReminderEnabled,
    practiceReminderMinutes,
    sessionId,
    sessionQuery.data,
  ]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (
      !session ||
      session.status === "completed" ||
      !draftReady ||
      !autoSavePracticeDrafts
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void savePracticeDraft(sessionId, answers);
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [answers, autoSavePracticeDrafts, draftReady, sessionId, sessionQuery.data]);

  const items = useMemo(() => sessionQuery.data?.items ?? [], [sessionQuery.data?.items]);
  const totalQuestions = items.length;
  const boundedIndex = Math.max(0, Math.min(currentIndex, Math.max(totalQuestions - 1, 0)));
  const currentItem = items[boundedIndex];

  useEffect(() => {
    if (totalQuestions === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > totalQuestions - 1) {
      setCurrentIndex(totalQuestions - 1);
    }
  }, [currentIndex, totalQuestions]);

  const answeredCount = useMemo(
    () =>
      items.filter((item) => {
        const answer = answers[item.id] ?? "";
        return isItemAnswered(item, answer);
      }).length,
    [answers, items],
  );
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const typeAnalytics = useMemo(() => {
    const session = sessionQuery.data;
    if (!session || session.status !== "completed") {
      return [] as Array<{ type: string; total: number; correct: number }>;
    }

    const summary = new Map<string, { type: string; total: number; correct: number }>();
    for (const item of session.items) {
      const entry = summary.get(item.questionType) ?? {
        type: item.questionType,
        total: 0,
        correct: 0,
      };
      entry.total += 1;
      if (item.isCorrect) {
        entry.correct += 1;
      }
      summary.set(item.questionType, entry);
    }

    return Array.from(summary.values()).sort((a, b) => a.type.localeCompare(b.type));
  }, [sessionQuery.data]);

  const updateAnswer = (itemId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      [itemId]: value,
    }));
  };

  const goToIndex = (index: number) => {
    if (totalQuestions <= 0) return;
    const nextIndex = Math.max(0, Math.min(index, totalQuestions - 1));
    setCurrentIndex(nextIndex);
  };

  const submitSession = async () => {
    if (!sessionQuery.data || sessionQuery.data.status === "completed") {
      return;
    }

    setSubmitError(null);

    try {
      await submitMutation.mutateAsync({
        answers: sessionQuery.data.items.map((item) => ({
          itemId: item.id,
          answer: answers[item.id]?.trim() || "",
        })),
      });
      await clearScheduledPracticeReminder(sessionId).catch(() => undefined);
      await clearPracticeDraft(sessionId).catch(() => undefined);
      setCurrentIndex(0);
      setShowSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("session.failedSubmit"));
    }
  };

  const onSubmit = () => {
    if (!sessionQuery.data || sessionQuery.data.status === "completed") {
      return;
    }

    if (!confirmBeforeSubmitPractice) {
      void submitSession();
      return;
    }

    setSubmitConfirmOpen(true);
  };

  const goToSessions = () => {
    router.replace("/practice/sessions" as RelativePathString);
  };

  if (sessionQuery.isLoading) {
    return (
      <AppShell>
        <View style={styles.centeredBlock}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.metaText}>{t("session.loading")}</Text>
        </View>
      </AppShell>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <AppShell>
        <View style={styles.centeredBlock}>
          <Text style={styles.errorText}>
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : t("session.failed")}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={goToSessions}
          >
            <Text style={styles.primaryButtonLabel}>{t("session.backToSessions")}</Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

  const isCompleted = sessionQuery.data.status === "completed";

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.heading}>{sessionQuery.data.title}</Text>
          <Text style={styles.metaText}>
            {t("session.startedMeta", {
              date: formatDateTime(sessionQuery.data.startedAt),
              count: sessionQuery.data.totalQuestions,
            })}
          </Text>
          <Text style={styles.metaText}>
            {t("session.statusMeta", { status: sessionQuery.data.status })}
            {isCompleted
              ? t("session.completedScoreMeta", {
                  correct: sessionQuery.data.correctAnswers ?? 0,
                  total: sessionQuery.data.totalQuestions,
                  percent: sessionQuery.data.scorePercent ?? 0,
                })
              : t("session.elapsedMeta", {
                  elapsed: formatElapsed(sessionQuery.data.startedAt, nowTs),
                })}
          </Text>
          {isCompleted ? (
            <Text style={styles.metaText}>
              {t("session.completedAt", { date: formatDateTime(sessionQuery.data.completedAt) })}
            </Text>
          ) : (
            <Text style={styles.metaText}>
              {t("session.progressMeta", {
                answered: answeredCount,
                total: totalQuestions,
                percent: progressPercent,
                unanswered: unansweredCount,
              })}
            </Text>
          )}
          <View style={styles.headerActionRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={goToSessions}
            >
              <Text style={styles.secondaryButtonLabel}>{t("session.backToSessions")}</Text>
            </Pressable>
          </View>
        </View>

        {isCompleted && showSubmitSuccess ? (
          <View style={styles.submitSuccessBanner}>
            <Text style={styles.submitSuccessTitle}>{t("session.submittedTitle")}</Text>
            <Text style={styles.submitSuccessHint}>{t("session.submittedHint")}</Text>
          </View>
        ) : null}

        {isCompleted && typeAnalytics.length > 0 ? (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>{t("session.resultByType")}</Text>
            {typeAnalytics.map((row) => {
              const accuracy = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                return (
                  <View key={`analytics-${row.type}`} style={styles.analyticsRow}>
                  <Text style={styles.analyticsType}>{toQuestionTypeLabel(row.type, t)}</Text>
                  <Text style={styles.analyticsValue}>
                    {row.correct}/{row.total} ({accuracy}%)
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {totalQuestions > 0 ? (
          <View style={styles.navigatorCard}>
            <Text style={styles.navigatorTitle}>{t("session.questionNavigator")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navigatorChipRow}
            >
              {items.map((item, index) => {
                const answer = answers[item.id] ?? "";
                const answered = isItemAnswered(item, answer);
                const active = index === boundedIndex;
                const correct = isCompleted && item.isCorrect === true;
                const wrong = isCompleted && item.isCorrect === false;

                return (
                  <Pressable
                    key={`navigator-${item.id}`}
                    style={({ pressed }) => [
                      styles.navigatorChip,
                      active && styles.navigatorChipActive,
                      answered && !isCompleted && styles.navigatorChipAnswered,
                      correct && styles.navigatorChipCorrect,
                      wrong && styles.navigatorChipWrong,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => goToIndex(index)}
                  >
                    <Text
                      style={[
                        styles.navigatorChipLabel,
                        active && styles.navigatorChipLabelActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {currentItem ? (
          <PracticeItemCard
            item={currentItem}
            isCompleted={isCompleted}
            answerValue={answers[currentItem.id] ?? ""}
            onAnswerChange={(value) => updateAnswer(currentItem.id, value)}
          />
        ) : null}

        {totalQuestions > 1 ? (
          <View style={styles.footerCard}>
            <View style={styles.paginationRow}>
              <Pressable
                disabled={boundedIndex <= 0}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  boundedIndex <= 0 && styles.buttonDisabled,
                  pressed && boundedIndex > 0 && styles.buttonPressed,
                ]}
                onPress={() => goToIndex(boundedIndex - 1)}
              >
                <Text style={styles.secondaryButtonLabel}>{t("session.previous")}</Text>
              </Pressable>
              <Text style={styles.metaText}>
                {t("session.questionProgress", { current: boundedIndex + 1, total: totalQuestions })}
              </Text>
              <Pressable
                disabled={boundedIndex >= totalQuestions - 1}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  boundedIndex >= totalQuestions - 1 && styles.buttonDisabled,
                  pressed && boundedIndex < totalQuestions - 1 && styles.buttonPressed,
                ]}
                onPress={() => goToIndex(boundedIndex + 1)}
              >
                <Text style={styles.secondaryButtonLabel}>{t("session.next")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!isCompleted ? (
          <View style={styles.footerCard}>
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            <Pressable
              disabled={submitMutation.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                submitMutation.isPending && styles.buttonDisabled,
                pressed && !submitMutation.isPending && styles.buttonPressed,
              ]}
              onPress={onSubmit}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonLabel}>
                  {t("session.submitSession", { answered: answeredCount, total: totalQuestions })}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={submitConfirmOpen}
        title={t("session.submitPractice")}
        subtitle={t("session.submitSubtitle")}
        onClose={() => setSubmitConfirmOpen(false)}
        footer={
          <View style={styles.sheetButtonRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => setSubmitConfirmOpen(false)}
            >
              <Text style={styles.secondaryButtonLabel}>{t("session.keepEditing")}</Text>
            </Pressable>
            <Pressable
              disabled={submitMutation.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.sheetPrimaryButton,
                submitMutation.isPending && styles.buttonDisabled,
                pressed && !submitMutation.isPending && styles.buttonPressed,
              ]}
              onPress={() => {
                setSubmitConfirmOpen(false);
                void submitSession();
              }}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonLabel}>{t("session.submitNow")}</Text>
              )}
            </Pressable>
          </View>
        }
      >
        <View style={styles.submitConfirmCard}>
          <View style={styles.submitConfirmStatRow}>
            <View style={styles.submitConfirmStat}>
              <Text style={styles.submitConfirmStatLabel}>{t("session.answered")}</Text>
              <Text style={styles.submitConfirmStatValue}>
                {answeredCount}/{totalQuestions}
              </Text>
            </View>
            <View style={styles.submitConfirmStat}>
              <Text style={styles.submitConfirmStatLabel}>{t("session.unanswered")}</Text>
              <Text style={styles.submitConfirmStatValue}>{unansweredCount}</Text>
            </View>
            <View style={styles.submitConfirmStat}>
              <Text style={styles.submitConfirmStatLabel}>{t("session.progress")}</Text>
              <Text style={styles.submitConfirmStatValue}>{progressPercent}%</Text>
            </View>
          </View>

          <Text style={styles.submitConfirmBody}>
            {t("session.submitBody", { count: unansweredCount })}
          </Text>

          {unansweredCount > 0 ? (
            <Text style={styles.submitConfirmHint}>
              {t("session.submitHintPending")}
            </Text>
          ) : (
            <Text style={styles.submitConfirmHint}>
              {t("session.submitHintDone")}
            </Text>
          )}
        </View>
      </BottomSheet>
    </AppShell>
  );
};

type PracticeItemCardProps = {
  item: PracticeSessionItem;
  isCompleted: boolean;
  answerValue: string;
  onAnswerChange: (value: string) => void;
};

const PracticeItemCard = ({ item, isCompleted, answerValue, onAnswerChange }: PracticeItemCardProps) => {
  const { t } = useTranslation("practice");
  const matchingLeftKeys = useMemo(() => getMatchingLeftKeys(item), [item]);
  const matchingRightChoices = useMemo(
    () =>
      Array.from(
        new Set(
          item.options.map((option) => option.text.trim()).filter((value) => value.length > 0),
        ),
      ),
    [item.options],
  );
  const matchingPairs = useMemo(() => parseMatchingAnswer(answerValue), [answerValue]);
  const submittedAnswerDisplay = useMemo(() => {
    if (item.questionType !== "matching") {
      return item.submittedAnswer || "-";
    }
    return formatMatchingAnswerForDisplay(item.submittedAnswer, matchingLeftKeys);
  }, [item.questionType, item.submittedAnswer, matchingLeftKeys]);
  const expectedAnswerDisplay = useMemo(() => {
    if (item.questionType !== "matching") {
      return item.answerText || "-";
    }
    return formatMatchingAnswerForDisplay(item.answerText, matchingLeftKeys);
  }, [item.answerText, item.questionType, matchingLeftKeys]);

  const updateMatchingPairs = (next: Record<string, string>) => {
    onAnswerChange(stringifyMatchingAnswer(next));
  };

  return (
    <View style={styles.card}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemCode}>
          Q{item.position} • {item.questionCode}
        </Text>
        <Text style={styles.itemType}>
          {toQuestionTypeLabel(item.questionType, t)} • {item.marks} marks
        </Text>
      </View>

      <MathRichText content={item.body} textStyle={styles.itemBody} />

      {item.options.length > 0 && item.questionType !== "matching" ? (
        <View style={styles.optionsWrap}>
          {item.options.map((option, index) => {
            const optionValue = option.label?.trim() || option.text;
            const selected = optionValue.trim() === answerValue.trim();
            return (
              <Pressable
                key={`${item.id}-option-${index + 1}`}
                disabled={isCompleted}
                style={({ pressed }) => [
                  styles.optionChip,
                  selected && styles.optionChipSelected,
                  isCompleted && option.isCorrect && styles.optionChipCorrect,
                  pressed && !isCompleted && styles.buttonPressed,
                ]}
                onPress={() => onAnswerChange(optionValue)}
              >
                <MathRichText
                  content={`${option.label ? `${option.label}. ` : ""}${option.text}`}
                  renderMode="native"
                  textStyle={styles.optionChipLabel}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {item.questionType === "matching" ? (
        <MatchingAnswerEditor
          leftKeys={matchingLeftKeys}
          rightChoices={matchingRightChoices}
          pairs={matchingPairs}
          readOnly={isCompleted}
          onChange={updateMatchingPairs}
        />
      ) : (
        <TextInput
          editable={!isCompleted}
          multiline
          placeholder={t("session.typeYourAnswer")}
          placeholderTextColor="#94A3B8"
          style={[styles.answerInput, isCompleted && styles.answerInputReadonly]}
          value={answerValue}
          onChangeText={onAnswerChange}
        />
      )}

      {isCompleted ? (
        <View style={styles.resultBlock}>
          <Text style={[styles.resultStatus, item.isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            {item.isCorrect ? t("session.correct") : t("session.incorrect")}
          </Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t("session.yourAnswer")}</Text>
            <MathRichText
              content={submittedAnswerDisplay}
              renderMode="native"
              textStyle={styles.resultText}
            />
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t("session.expected")}</Text>
            <MathRichText content={expectedAnswerDisplay} textStyle={styles.resultText} />
          </View>
          {item.explanation ? (
            <MathRichText content={item.explanation} textStyle={styles.explanationText} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

type MatchingAnswerEditorProps = {
  leftKeys: string[];
  rightChoices: string[];
  pairs: Record<string, string>;
  readOnly: boolean;
  onChange: (next: Record<string, string>) => void;
};

const MatchingAnswerEditor = ({
  leftKeys,
  rightChoices,
  pairs,
  readOnly,
  onChange,
}: MatchingAnswerEditorProps) => {
  const { t } = useTranslation("practice");
  const [selectedLeft, setSelectedLeft] = useState<string>("");
  const normalizedLeftSet = useMemo(
    () => new Set(leftKeys.map((left) => left.trim().toLowerCase())),
    [leftKeys],
  );
  const displayRightChoices = useMemo(() => {
    const filtered = rightChoices.filter(
      (choice) => !normalizedLeftSet.has(choice.trim().toLowerCase()),
    );
    // Keep fallback for edge cases where both sides intentionally share the same text.
    return filtered.length >= Math.min(2, rightChoices.length) ? filtered : rightChoices;
  }, [normalizedLeftSet, rightChoices]);

  useEffect(() => {
    if (leftKeys.length === 0) {
      setSelectedLeft("");
      return;
    }

    setSelectedLeft((current) => {
      if (current && leftKeys.includes(current)) {
        return current;
      }

      const firstUnpaired = leftKeys.find((left) => !pairs[left]?.trim());
      return firstUnpaired ?? leftKeys[0] ?? "";
    });
  }, [leftKeys, pairs]);

  const pairedCount = useMemo(
    () => leftKeys.filter((left) => Boolean(pairs[left]?.trim())).length,
    [leftKeys, pairs],
  );

  const usedRightChoices = useMemo(
    () =>
      new Set(
        Object.entries(pairs)
          .filter(([left, right]) => left !== selectedLeft && right.trim().length > 0)
          .map(([, right]) => right.trim()),
      ),
    [pairs, selectedLeft],
  );

  const assignRightChoice = (right: string) => {
    if (!selectedLeft || readOnly) {
      return;
    }

    const next = { ...pairs };
    for (const [left, value] of Object.entries(next)) {
      if (left !== selectedLeft && value.trim() === right.trim()) {
        delete next[left];
      }
    }
    next[selectedLeft] = right;
    onChange(next);

    const nextUnpaired = leftKeys.find(
      (left) => left !== selectedLeft && !(next[left]?.trim()),
    );
    if (nextUnpaired) {
      setSelectedLeft(nextUnpaired);
    }
  };

  const clearSelectedLeft = () => {
    if (!selectedLeft || readOnly || !pairs[selectedLeft]?.trim()) {
      return;
    }

    const next = { ...pairs };
    delete next[selectedLeft];
    onChange(next);
  };

  return (
    <View style={styles.matchingBlock}>
      <View style={styles.matchingHeaderRow}>
        <View style={styles.matchingHeaderCopy}>
          <Text style={styles.matchingTitle}>{t("session.matchingTitle")}</Text>
          <Text style={styles.matchingHint}>
            {t("session.matchingPairsCompleted", { count: pairedCount, total: leftKeys.length })}
          </Text>
        </View>
        {selectedLeft ? (
          <Pressable
            disabled={readOnly || !pairs[selectedLeft]?.trim()}
            style={({ pressed }) => [
              styles.matchingClearChip,
              (readOnly || !pairs[selectedLeft]?.trim()) && styles.buttonDisabled,
              pressed &&
                !readOnly &&
                Boolean(pairs[selectedLeft]?.trim()) &&
                styles.buttonPressed,
            ]}
            onPress={clearSelectedLeft}
          >
            <Text style={styles.matchingClearLabel}>{t("session.clearSelected")}</Text>
          </Pressable>
        ) : null}
      </View>

      {leftKeys.length === 0 || displayRightChoices.length === 0 ? (
        <Text style={styles.matchingHint}>{t("session.noMatchingOptions")}</Text>
      ) : (
        <>
          <View style={styles.matchingPromptList}>
            {leftKeys.map((left, index) => {
              const selected = left === selectedLeft;
              const assignedRight = pairs[left]?.trim() ?? "";
              return (
                <Pressable
                  key={`matching-${left}`}
                  disabled={readOnly}
                  style={({ pressed }) => [
                    styles.matchingPromptCard,
                    selected && styles.matchingPromptCardSelected,
                    assignedRight && styles.matchingPromptCardPaired,
                    pressed && !readOnly && styles.buttonPressed,
                  ]}
                  onPress={() => setSelectedLeft(left)}
                >
                  <View style={styles.matchingPromptHeader}>
                    <Text style={styles.matchingPromptIndex}>{index + 1}</Text>
                    {assignedRight ? (
                      <Text style={styles.matchingPromptStatus}>{t("session.paired")}</Text>
                    ) : (
                      <Text style={styles.matchingPromptPending}>{t("session.waiting")}</Text>
                    )}
                  </View>
                  <MathRichText
                    content={left}
                    inline
                    renderMode="native"
                    textStyle={styles.matchingLeft}
                  />
                  <View style={styles.matchingAssignedBox}>
                    <Text style={styles.matchingAssignedLabel}>{t("session.currentMatch")}</Text>
                    <MathRichText
                      content={assignedRight || t("session.chooseFromBank")}
                      inline
                      renderMode="native"
                      textStyle={[
                        styles.matchingAssignedValue,
                        !assignedRight && styles.matchingAssignedPlaceholder,
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.matchingAnswerBank}>
            <Text style={styles.matchingBankTitle}>
              {selectedLeft ? t("session.answerBank") : t("session.selectPromptToStart")}
            </Text>
            {selectedLeft ? (
              <MathRichText
                content={selectedLeft}
                inline
                renderMode="native"
                textStyle={styles.matchingSelectedPrompt}
              />
            ) : null}
            {selectedLeft ? (
              <Text style={styles.matchingBankHint}>
                {t("session.answerBankHint")}
              </Text>
            ) : null}
            <View style={styles.matchingChoices}>
              {displayRightChoices.map((right) => {
                const selectedRight = selectedLeft ? pairs[selectedLeft]?.trim() === right : false;
                const alreadyUsed = usedRightChoices.has(right.trim());
                return (
                  <Pressable
                    key={`matching-choice-${right}`}
                    disabled={readOnly || !selectedLeft}
                    style={({ pressed }) => [
                      styles.matchingChoiceChip,
                      selectedRight && styles.matchingChoiceChipActive,
                      alreadyUsed && !selectedRight && styles.matchingChoiceChipReassign,
                      pressed && !readOnly && selectedLeft && styles.buttonPressed,
                    ]}
                    onPress={() => assignRightChoice(right)}
                  >
                    <MathRichText
                      content={right}
                      inline
                      renderMode="native"
                      textStyle={[
                        styles.matchingChoiceLabel,
                        selectedRight && styles.matchingChoiceLabelActive,
                        alreadyUsed && !selectedRight && styles.matchingChoiceLabelReassign,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  centeredBlock: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  headerActionRow: {
    marginTop: 8,
  },
  heading: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
  },
  metaText: {
    color: "#475569",
    fontSize: 12,
  },
  analyticsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  submitSuccessBanner: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  submitSuccessTitle: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "800",
  },
  submitSuccessHint: {
    color: "#065F46",
    fontSize: 13,
    lineHeight: 19,
  },
  analyticsTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  analyticsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  analyticsType: {
    color: "#334155",
    fontSize: 13,
  },
  analyticsValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  navigatorCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  navigatorTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  navigatorChipRow: {
    gap: 8,
  },
  navigatorChip: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  navigatorChipActive: {
    backgroundColor: "#E0EAFF",
    borderColor: "#4F7DF3",
  },
  navigatorChipAnswered: {
    borderColor: "#16A34A",
  },
  navigatorChipCorrect: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  navigatorChipWrong: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DC2626",
  },
  navigatorChipLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  navigatorChipLabelActive: {
    color: "#1D4ED8",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  itemHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemCode: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  itemType: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  itemBody: {
    color: "#1E293B",
    fontSize: 15,
    lineHeight: 21,
  },
  optionsWrap: {
    gap: 8,
  },
  optionChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionChipSelected: {
    backgroundColor: "#E0EAFF",
    borderColor: "#4F7DF3",
  },
  optionChipCorrect: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  optionChipLabel: {
    color: "#1E293B",
    fontSize: 13,
    lineHeight: 18,
  },
  answerInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  answerInputReadonly: {
    opacity: 0.8,
  },
  matchingBlock: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  matchingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  matchingHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  matchingTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  matchingHint: {
    color: "#64748B",
    fontSize: 12,
  },
  matchingPromptList: {
    gap: 8,
  },
  matchingPromptCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  matchingPromptCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  matchingPromptCardPaired: {
    borderColor: "#93C5FD",
  },
  matchingPromptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  matchingPromptIndex: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  matchingPromptStatus: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "700",
  },
  matchingPromptPending: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  matchingLeft: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  matchingAssignedBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    gap: 4,
    padding: 10,
  },
  matchingAssignedLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  matchingAssignedValue: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
  matchingAssignedPlaceholder: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  matchingAnswerBank: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  matchingBankTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  matchingSelectedPrompt: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },
  matchingBankHint: {
    color: "#64748B",
    fontSize: 11,
  },
  matchingChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2,
  },
  matchingChoiceChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchingChoiceChipActive: {
    backgroundColor: "#E0EAFF",
    borderColor: "#4F7DF3",
  },
  matchingChoiceChipReassign: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
  },
  matchingChoiceLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  matchingChoiceLabelActive: {
    color: "#1D4ED8",
  },
  matchingChoiceLabelReassign: {
    color: "#B45309",
  },
  matchingClearChip: {
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchingClearLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  footerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  paginationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 96,
    paddingHorizontal: 10,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  submitConfirmCard: {
    gap: 12,
    paddingBottom: 8,
  },
  submitConfirmStatRow: {
    flexDirection: "row",
    gap: 10,
  },
  submitConfirmStat: {
    backgroundColor: "#F8FAFC",
    borderColor: "#DBEAFE",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitConfirmStatLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  submitConfirmStatValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  submitConfirmBody: {
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 21,
  },
  submitConfirmHint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  resultBlock: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  resultCorrect: {
    color: "#15803D",
  },
  resultWrong: {
    color: "#B91C1C",
  },
  resultText: {
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
  },
  resultRow: {
    gap: 2,
  },
  resultLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  explanationText: {
    color: "#0F172A",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  sheetPrimaryButton: {
    flex: 1,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});
