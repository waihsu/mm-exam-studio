import { useRouter, type RelativePathString } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { usePracticeSessionDetailQuery } from "./use-practice-session-detail-query";
import { useSubmitPracticeSessionMutation } from "./use-submit-practice-session-mutation";
import {
  clearPracticeDraft,
  loadPracticeDraft,
  savePracticeDraft,
} from "../services/practice-draft-store";
import {
  clearPracticeReminderNotification,
  syncPracticeReminderNotification,
} from "../services/practice-reminder-notification.service";
import { isPracticeItemAnswered } from "../utils/practice-session-answer";

type TypeAnalyticsRow = {
  type: string;
  total: number;
  correct: number;
};

export function usePracticeSessionController(sessionId: string) {
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

  useEffect(() => {
    setAnswers({});
    setCurrentIndex(0);
    setDraftReady(false);
    setShowSubmitSuccess(false);
  }, [sessionId]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) return;
    let cancelled = false;

    const hydrate = async () => {
      const serverAnswers = session.items.reduce<Record<string, string>>(
        (next, item) => {
          next[item.id] = item.submittedAnswer ?? "";
          return next;
        },
        {}
      );

      if (session.status === "completed") {
        await clearPracticeDraft(sessionId).catch(() => undefined);
        if (cancelled) return;
        setAnswers(serverAnswers);
        setCurrentIndex(0);
        setDraftReady(true);
        return;
      }

      if (!settings.autoSavePracticeDrafts) {
        if (cancelled) return;
        const firstIncompleteIndex = session.items.findIndex(
          item => !isPracticeItemAnswered(item, serverAnswers[item.id] ?? "")
        );
        setAnswers(serverAnswers);
        setCurrentIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
        setDraftReady(true);
        return;
      }

      const draftAnswers = await loadPracticeDraft(sessionId).catch(
        () => ({}) as Record<string, string>
      );
      if (cancelled) return;
      const allowedItemIds = new Set(session.items.map(item => item.id));
      const mergedAnswers = { ...serverAnswers, ...draftAnswers };
      const filteredAnswers = Object.entries(mergedAnswers).reduce<
        Record<string, string>
      >((next, [itemId, value]) => {
        if (allowedItemIds.has(itemId)) next[itemId] = value;
        return next;
      }, {});
      const firstIncompleteIndex = session.items.findIndex(
        item => !isPracticeItemAnswered(item, filteredAnswers[item.id] ?? "")
      );
      setAnswers(filteredAnswers);
      setCurrentIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
      setDraftReady(true);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionQuery.data, settings.autoSavePracticeDrafts]);

  useEffect(() => {
    setNowTs(Date.now());
  }, [sessionQuery.data?.startedAt]);

  useEffect(() => {
    if (!sessionQuery.data || sessionQuery.data.status === "completed") return;
    const intervalId = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [sessionQuery.data]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) return;
    if (session.status === "completed" || !settings.practiceReminderEnabled) {
      void clearPracticeReminderNotification(sessionId);
      return;
    }
    void syncPracticeReminderNotification({
      sessionId,
      startedAt: session.startedAt,
      title: session.title.trim() || "Practice Session",
      enabled: settings.practiceReminderEnabled,
      minutes: settings.practiceReminderMinutes,
    }).catch(() => undefined);
  }, [
    sessionId,
    sessionQuery.data,
    settings.practiceReminderEnabled,
    settings.practiceReminderMinutes,
  ]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (
      !session ||
      session.status === "completed" ||
      !draftReady ||
      !settings.autoSavePracticeDrafts
    ) {
      return;
    }
    const timeoutId = setTimeout(() => {
      void savePracticeDraft(sessionId, answers);
    }, 450);
    return () => clearTimeout(timeoutId);
  }, [
    answers,
    draftReady,
    sessionId,
    sessionQuery.data,
    settings.autoSavePracticeDrafts,
  ]);

  const items = useMemo(
    () => sessionQuery.data?.items ?? [],
    [sessionQuery.data?.items]
  );
  const totalQuestions = items.length;
  const boundedIndex = Math.max(
    0,
    Math.min(currentIndex, Math.max(totalQuestions - 1, 0))
  );
  const currentItem = items[boundedIndex];

  useEffect(() => {
    if (totalQuestions === 0) {
      setCurrentIndex(0);
    } else if (currentIndex > totalQuestions - 1) {
      setCurrentIndex(totalQuestions - 1);
    }
  }, [currentIndex, totalQuestions]);

  const answeredCount = useMemo(
    () =>
      items.filter(item => isPracticeItemAnswered(item, answers[item.id] ?? ""))
        .length,
    [answers, items]
  );
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const typeAnalytics = useMemo<TypeAnalyticsRow[]>(() => {
    const session = sessionQuery.data;
    if (!session || session.status !== "completed") return [];
    const summary = new Map<string, TypeAnalyticsRow>();
    for (const item of session.items) {
      const entry = summary.get(item.questionType) ?? {
        type: item.questionType,
        total: 0,
        correct: 0,
      };
      entry.total += 1;
      if (item.isCorrect) entry.correct += 1;
      summary.set(item.questionType, entry);
    }
    return Array.from(summary.values()).sort((a, b) =>
      a.type.localeCompare(b.type)
    );
  }, [sessionQuery.data]);

  const goToIndex = (index: number) => {
    if (totalQuestions <= 0) return;
    setCurrentIndex(Math.max(0, Math.min(index, totalQuestions - 1)));
  };
  const updateAnswer = (itemId: string, value: string) => {
    setAnswers(current => ({ ...current, [itemId]: value }));
  };
  const goToSessions = () => {
    router.replace("/practice/sessions" as RelativePathString);
  };

  const submitSession = async () => {
    const session = sessionQuery.data;
    if (!session || session.status === "completed") return;
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync({
        answers: session.items.map(item => ({
          itemId: item.id,
          answer: answers[item.id]?.trim() || "",
        })),
      });
      await clearPracticeReminderNotification(sessionId).catch(() => undefined);
      await clearPracticeDraft(sessionId).catch(() => undefined);
      setCurrentIndex(0);
      setShowSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("session.failedSubmit")
      );
    }
  };

  const requestSubmit = () => {
    if (!sessionQuery.data || sessionQuery.data.status === "completed") return;
    if (!settings.confirmBeforeSubmitPractice) {
      void submitSession();
      return;
    }
    setSubmitConfirmOpen(true);
  };

  return {
    answers,
    answeredCount,
    boundedIndex,
    currentItem,
    formatDateTime,
    goToIndex,
    goToSessions,
    isCompleted: sessionQuery.data?.status === "completed",
    items,
    nowTs,
    progressPercent,
    requestSubmit,
    sessionQuery,
    showSubmitSuccess,
    submitConfirmOpen,
    submitError,
    submitMutation,
    submitSession,
    totalQuestions,
    typeAnalytics,
    unansweredCount,
    isItemAnswered: (itemId: string) => {
      const item = items.find(candidate => candidate.id === itemId);
      return item ? isPracticeItemAnswered(item, answers[itemId] ?? "") : false;
    },
    updateAnswer,
    setSubmitConfirmOpen,
  };
}
