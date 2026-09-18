import type { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MathRichText } from "@/components/ui/math-rich-text";
import { QuestionMediaGallery } from "@/components/ui/question-media-gallery";
import {
  EmptyStateCard,
  InlineErrorState,
  InlineLoadingState,
} from "@/components/ui/state-blocks";
import { useTranslation } from "@/i18n";
import type { CatalogQuestion } from "@/features/practice/types/practice.types";
import type { QuestionPaperDetail } from "../types/papers.types";
import {
  formatPaperAnswerForDisplay,
  getPaperQuestionTypeLabelKey,
} from "../utils/paper-detail";

type PaperDetailQuestionListProps = {
  hasActionPending: boolean;
  includeAnswerKey: boolean;
  isDraft: boolean;
  paper: QuestionPaperDetail;
  swapCandidateError: unknown;
  swapCandidates: CatalogQuestion[];
  swapItemId: string | null;
  swapCandidatesLoading: boolean;
  swapCandidatesFailed: boolean;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onRemoveItem: (itemId: string) => void;
  onSetSwapItemId: Dispatch<SetStateAction<string | null>>;
  onSwapItem: (itemId: string, candidateQuestionId: string) => void;
};

export const PaperDetailQuestionList = ({
  hasActionPending,
  includeAnswerKey,
  isDraft,
  paper,
  swapCandidateError,
  swapCandidates,
  swapCandidatesFailed,
  swapCandidatesLoading,
  swapItemId,
  onMoveItem,
  onRemoveItem,
  onSetSwapItemId,
  onSwapItem,
}: PaperDetailQuestionListProps) => {
  const { t } = useTranslation(["papers", "common"]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("papers:detail.questions")}</Text>
      <Text style={styles.hint}>
        {isDraft
          ? t("papers:detail.draftQuestionHint")
          : t("papers:detail.finalizedQuestionHint")}
      </Text>

      {paper.items.length === 0 ? (
        <EmptyStateCard title={t("papers:detail.noQuestions")} />
      ) : null}

      {paper.items.map((item, index) => {
        const isSwapPanelOpen = swapItemId === item.id;
        const answerDisplay = formatPaperAnswerForDisplay(item).trim();
        const cannotMoveUp = hasActionPending || index === 0;
        const cannotMoveDown =
          hasActionPending || index === paper.items.length - 1;

        return (
          <View key={item.id} style={styles.questionCard}>
            <View style={styles.questionHeadingRow}>
              <Text style={styles.questionCode}>Q{item.position}</Text>
              <View style={styles.questionMetaPills}>
                <Text style={styles.questionMetaPill}>
                  {t(getPaperQuestionTypeLabelKey(item.questionType))}
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
                <Text style={styles.answerPrefix}>
                  {t("papers:detail.answer")}
                </Text>
                <MathRichText
                  content={answerDisplay}
                  textStyle={styles.answerText}
                />
                <QuestionMediaGallery imageUrls={item.solutionImageUrls} />
              </View>
            ) : null}

            {isDraft ? (
              <View style={styles.itemActionRow}>
                <ActionButton
                  disabled={cannotMoveUp}
                  label={t("papers:detail.moveUp")}
                  onPress={() => onMoveItem(item.id, "up")}
                />
                <ActionButton
                  disabled={cannotMoveDown}
                  label={t("papers:detail.moveDown")}
                  onPress={() => onMoveItem(item.id, "down")}
                />
                <ActionButton
                  active={isSwapPanelOpen}
                  disabled={hasActionPending}
                  label={t("papers:detail.replace")}
                  onPress={() =>
                    onSetSwapItemId(currentValue =>
                      currentValue === item.id ? null : item.id
                    )
                  }
                />
                <ActionButton
                  danger
                  disabled={hasActionPending}
                  label={t("papers:home.remove")}
                  onPress={() => onRemoveItem(item.id)}
                />
              </View>
            ) : null}

            {isDraft && isSwapPanelOpen ? (
              <SwapCandidates
                candidateError={swapCandidateError}
                candidates={swapCandidates}
                hasActionPending={hasActionPending}
                isFailed={swapCandidatesFailed}
                isLoading={swapCandidatesLoading}
                itemId={item.id}
                onSwapItem={onSwapItem}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const ActionButton = ({
  active = false,
  danger = false,
  disabled,
  label,
  onPress,
}: {
  active?: boolean;
  danger?: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    disabled={disabled}
    style={({ pressed }) => [
      styles.smallButton,
      active && styles.smallButtonActive,
      danger && styles.dangerSmallButton,
      disabled && styles.buttonDisabled,
      pressed && !disabled && styles.buttonPressed,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.smallButtonLabel,
        active && styles.smallButtonLabelActive,
        danger && styles.dangerSmallButtonLabel,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const SwapCandidates = ({
  candidateError,
  candidates,
  hasActionPending,
  isFailed,
  isLoading,
  itemId,
  onSwapItem,
}: {
  candidateError: unknown;
  candidates: CatalogQuestion[];
  hasActionPending: boolean;
  isFailed: boolean;
  isLoading: boolean;
  itemId: string;
  onSwapItem: (itemId: string, candidateQuestionId: string) => void;
}) => {
  const { t } = useTranslation(["papers", "common"]);

  return (
    <View style={styles.swapPanel}>
      <Text style={styles.swapPanelTitle}>
        {t("papers:detail.replacementCandidates")}
      </Text>
      {isLoading ? (
        <InlineLoadingState label={t("papers:detail.loadingReplacements")} />
      ) : null}
      {isFailed ? (
        <InlineErrorState
          message={
            candidateError instanceof Error
              ? candidateError.message
              : t("papers:detail.failedReplacements")
          }
        />
      ) : null}
      {!isLoading && !isFailed && candidates.length === 0 ? (
        <EmptyStateCard title={t("papers:detail.noReplacements")} />
      ) : null}
      {candidates.map(candidate => (
        <View key={candidate.id} style={styles.candidateCard}>
          <Text style={styles.candidateHeading}>
            {candidate.questionCode} •{" "}
            {t(getPaperQuestionTypeLabelKey(candidate.type))} •{" "}
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
            onPress={() => onSwapItem(itemId, candidate.id)}
          >
            <Text style={styles.smallPrimaryButtonLabel}>
              {t("papers:detail.useThisQuestion")}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: "#202321", fontSize: 16, fontWeight: "700" },
  hint: { color: "#6E706B", fontSize: 12 },
  metaText: { color: "#6E706B", fontSize: 12 },
  questionCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
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
  questionCode: { color: "#202321", flex: 1, fontSize: 15, fontWeight: "800" },
  questionMetaPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  questionMetaPill: {
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 999,
    borderWidth: 1,
    color: "#6E706B",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  questionBody: { color: "#202321", fontSize: 14, lineHeight: 20 },
  answerText: {
    color: "#D76F55",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  answerRow: { gap: 2 },
  answerPrefix: { color: "#D76F55", fontSize: 12, fontWeight: "700" },
  itemActionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smallButton: {
    alignItems: "center",
    borderColor: "#CFC9BD",
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 82,
    paddingHorizontal: 10,
  },
  smallButtonActive: { backgroundColor: "#E7EFE9", borderColor: "#A8C9BD" },
  smallButtonLabel: { color: "#4F514B", fontSize: 12, fontWeight: "700" },
  smallButtonLabelActive: { color: "#48766B" },
  dangerSmallButton: { borderColor: "#EAD1C3" },
  dangerSmallButtonLabel: { color: "#AD5948" },
  smallPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#D76F55",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10,
  },
  smallPrimaryButtonLabel: {
    color: "#FFFDF8",
    fontSize: 12,
    fontWeight: "700",
  },
  swapPanel: {
    borderTopColor: "#D8D4C9",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
  },
  swapPanelTitle: { color: "#202321", fontSize: 13, fontWeight: "700" },
  candidateCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  candidateHeading: { color: "#202321", fontSize: 12, fontWeight: "700" },
  candidateBody: { color: "#4F514B", fontSize: 13, lineHeight: 18 },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85 },
});
