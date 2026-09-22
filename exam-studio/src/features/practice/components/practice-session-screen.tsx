import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { InlineErrorState, PageStateCard } from "@/components/ui/state-blocks";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { usePracticeSessionController } from "../hooks/use-practice-session-controller";
import {
  formatPracticeElapsed,
  toPracticeQuestionTypeLabel,
} from "../utils/practice-session-formatters";
import { PracticeSessionHeader } from "./practice-session-header";
import { PracticeSessionLoadingState } from "./practice-session-loading-state";
import { PracticeSessionNavigator } from "./practice-session-navigator";
import { PracticeSessionPagination } from "./practice-session-pagination";
import { PracticeSessionQuestionCard } from "./practice-session-question-card";
import { PracticeSessionResultSummary } from "./practice-session-result-summary";

type PracticeSessionScreenProps = { sessionId: string };

export function PracticeSessionScreen({
  sessionId,
}: PracticeSessionScreenProps) {
  const { t } = useTranslation("practice");
  const controller = usePracticeSessionController(sessionId);
  const {
    answers,
    answeredCount,
    boundedIndex,
    currentItem,
    formatDateTime,
    goToIndex,
    goToSessions,
    isItemAnswered,
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
    updateAnswer,
    setSubmitConfirmOpen,
  } = controller;

  if (sessionQuery.isLoading) {
    return (
      <AppShell>
        <PracticeSessionLoadingState title={t("session.loading")} />
      </AppShell>
    );
  }
  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <AppShell>
        <PageStateCard
          title={t("session.failed")}
          hint={
            sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : t("session.failed")
          }
          actionLabel={t("session.backToSessions")}
          onAction={goToSessions}
        />
      </AppShell>
    );
  }

  const session = sessionQuery.data;
  const isCompleted = session.status === "completed";
  const progressLabel = t("session.questionProgress", {
    current: boundedIndex + 1,
    total: totalQuestions,
  });

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PracticeSessionHeader
          title={session.title}
          backLabel={t("session.backToSessions")}
          metaLine={t("session.startedMeta", {
            date: formatDateTime(session.startedAt),
            count: session.totalQuestions,
          })}
          progressLabel={
            isCompleted
              ? `${session.correctAnswers ?? 0}/${session.totalQuestions}`
              : t("session.elapsedMeta", {
                  elapsed: formatPracticeElapsed(session.startedAt, nowTs),
                }).replace(" • ", "")
          }
          answeredLabel={`${t("session.answered")}: ${answeredCount}/${totalQuestions}`}
          unansweredLabel={`${t("session.unanswered")}: ${unansweredCount}`}
          completedDetail={
            isCompleted
              ? `${t("session.completedAt", { date: formatDateTime(session.completedAt) })}${t("session.completedScoreMeta", { correct: session.correctAnswers ?? 0, total: session.totalQuestions, percent: session.scorePercent ?? 0 })}`
              : undefined
          }
          onBack={goToSessions}
        />

        {isCompleted && (showSubmitSuccess || typeAnalytics.length > 0) ? (
          <PracticeSessionResultSummary
            showSuccess={showSubmitSuccess}
            successTitle={t("session.submittedTitle")}
            successHint={t("session.submittedHint")}
            analyticsTitle={t("session.resultByType")}
            typeRows={typeAnalytics.map(row => ({
              ...row,
              label: toPracticeQuestionTypeLabel(row.type, t),
            }))}
          />
        ) : null}

        {totalQuestions > 0 ? (
          <PracticeSessionNavigator
            title={t("session.questionNavigator")}
            progressLabel={progressLabel}
            completed={isCompleted}
            currentLabel={t("session.currentQuestion")}
            answeredLabel={t("session.answered")}
            correctLabel={t("session.correct")}
            incorrectLabel={t("session.incorrect")}
            items={items.map((item, index) => ({
              id: item.id,
              index,
              answered: isItemAnswered(item.id),
              active: index === boundedIndex,
              correct: isCompleted && item.isCorrect === true,
              wrong: isCompleted && item.isCorrect === false,
            }))}
            onSelect={goToIndex}
          />
        ) : null}

        {currentItem ? (
          <PracticeSessionQuestionCard
            item={currentItem}
            isCompleted={isCompleted}
            answerValue={answers[currentItem.id] ?? ""}
            onAnswerChange={value => updateAnswer(currentItem.id, value)}
          />
        ) : null}

        {totalQuestions > 1 ? (
          <PracticeSessionPagination
            previousLabel={t("session.previous")}
            nextLabel={t("session.next")}
            progressLabel={progressLabel}
            previousDisabled={boundedIndex <= 0}
            nextDisabled={boundedIndex >= totalQuestions - 1}
            onPrevious={() => goToIndex(boundedIndex - 1)}
            onNext={() => goToIndex(boundedIndex + 1)}
          />
        ) : null}

        {!isCompleted ? (
          <View style={styles.footerCard}>
            {submitError ? <InlineErrorState message={submitError} /> : null}
            <SubmitButton
              pending={submitMutation.isPending}
              label={t("session.submitSession", {
                answered: answeredCount,
                total: totalQuestions,
              })}
              onPress={requestSubmit}
            />
          </View>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={submitConfirmOpen}
        title={t("session.submitPractice")}
        subtitle={t("session.submitSubtitle")}
        onClose={() => setSubmitConfirmOpen(false)}
        footer={
          <SubmitConfirmationFooter
            pending={submitMutation.isPending}
            keepEditingLabel={t("session.keepEditing")}
            submitLabel={t("session.submitNow")}
            onCancel={() => setSubmitConfirmOpen(false)}
            onSubmit={() => {
              setSubmitConfirmOpen(false);
              void submitSession();
            }}
          />
        }
      >
        <View style={styles.submitConfirmCard}>
          <View style={styles.submitConfirmStatRow}>
            <SubmitStat
              label={t("session.answered")}
              value={`${answeredCount}/${totalQuestions}`}
            />
            <SubmitStat
              label={t("session.unanswered")}
              value={`${unansweredCount}`}
            />
            <SubmitStat
              label={t("session.progress")}
              value={`${progressPercent}%`}
            />
          </View>
          <Text style={styles.submitConfirmBody}>
            {t("session.submitBody", { count: unansweredCount })}
          </Text>
          <Text style={styles.submitConfirmHint}>
            {unansweredCount > 0
              ? t("session.submitHintPending")
              : t("session.submitHintDone")}
          </Text>
        </View>
      </BottomSheet>
    </AppShell>
  );
}

function SubmitButton({
  pending,
  label,
  onPress,
}: {
  pending: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={pending}
      style={({ pressed }) => [
        styles.primaryButton,
        pending && styles.buttonDisabled,
        pressed && !pending && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      {pending ? (
        <ActivityIndicator color="#FFFDF8" />
      ) : (
        <Text style={styles.primaryButtonLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

function SubmitConfirmationFooter({
  pending,
  keepEditingLabel,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  keepEditingLabel: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.sheetButtonRow}>
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onCancel}
      >
        <Text style={styles.secondaryButtonLabel}>{keepEditingLabel}</Text>
      </Pressable>
      <View style={styles.sheetPrimaryButton}>
        <SubmitButton
          pending={pending}
          label={submitLabel}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

function SubmitStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.submitConfirmStat}>
      <Text style={styles.submitConfirmStatLabel}>{label}</Text>
      <Text style={styles.submitConfirmStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { gap: 12, paddingBottom: 20 },
  footerCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 3,
    gap: 10,
    padding: 14,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  sheetButtonRow: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CFC9BD",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 96,
    paddingHorizontal: 10,
  },
  secondaryButtonLabel: { color: "#4F514B", fontSize: 13, fontWeight: "700" },
  sheetPrimaryButton: { flex: 1 },
  submitConfirmCard: { gap: 12, paddingBottom: 8 },
  submitConfirmStatRow: { flexDirection: "row", gap: 10 },
  submitConfirmStat: {
    backgroundColor: "#F8F5EE",
    borderColor: "#E7EFE9",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  submitConfirmStatLabel: { color: "#6E706B", fontSize: 12, fontWeight: "700" },
  submitConfirmStatValue: { color: "#202321", fontSize: 18, fontWeight: "800" },
  submitConfirmBody: { color: "#202321", fontSize: 14, lineHeight: 21 },
  submitConfirmHint: { color: "#6E706B", fontSize: 13, lineHeight: 19 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#D76F55",
    borderRadius: 13,
    elevation: 2,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 14,
    shadowColor: "#D76F55",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
  },
  primaryButtonLabel: { color: "#FFFDF8", fontSize: 14, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.9 },
});
