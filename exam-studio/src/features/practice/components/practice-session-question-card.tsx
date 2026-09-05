import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MathRichText } from "@/components/ui/math-rich-text";
import { QuestionMediaGallery } from "@/components/ui/question-media-gallery";
import type { PracticeSessionItem } from "../types/practice.types";
import {
  parseMatchingAnswer,
  stringifyMatchingAnswer,
} from "../utils/matching-answer";
import {
  formatMatchingAnswerForDisplay,
  getMatchingLeftKeys,
  usesChoiceOptions,
  usesTextAnswerInput,
} from "../utils/practice-session-answer";
import {
  formatPracticeMarksLabel,
  toPracticeQuestionTypeLabel,
} from "../utils/practice-session-formatters";

type PracticeSessionQuestionCardProps = {
  item: PracticeSessionItem;
  isCompleted: boolean;
  answerValue: string;
  onAnswerChange: (value: string) => void;
};

export function PracticeSessionQuestionCard({
  item,
  isCompleted,
  answerValue,
  onAnswerChange,
}: PracticeSessionQuestionCardProps) {
  const { t } = useTranslation("practice");
  const matchingLeftKeys = useMemo(() => getMatchingLeftKeys(item), [item]);
  const matchingRightChoices = useMemo(
    () =>
      Array.from(
        new Set(
          item.options
            .map(option => option.text.trim())
            .filter(value => value.length > 0)
        )
      ),
    [item.options]
  );
  const matchingPairs = useMemo(
    () => parseMatchingAnswer(answerValue),
    [answerValue]
  );
  const submittedAnswerDisplay = useMemo(() => {
    if (item.questionType !== "matching") return item.submittedAnswer || "-";
    return formatMatchingAnswerForDisplay(
      item.submittedAnswer,
      matchingLeftKeys
    );
  }, [item.questionType, item.submittedAnswer, matchingLeftKeys]);
  const expectedAnswerDisplay = useMemo(() => {
    if (item.questionType !== "matching") return item.answerText || "-";
    return formatMatchingAnswerForDisplay(item.answerText, matchingLeftKeys);
  }, [item.answerText, item.questionType, matchingLeftKeys]);

  return (
    <View style={styles.card}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemQuestionLabel}>Q{item.position}</Text>
        <View style={styles.itemMetaCluster}>
          <View style={styles.itemMetaBadge}>
            <Text style={styles.itemMetaBadgeLabel}>
              {toPracticeQuestionTypeLabel(item.questionType, t)}
            </Text>
          </View>
          <View style={styles.itemMetaBadge}>
            <Text style={styles.itemMetaBadgeLabel}>
              {formatPracticeMarksLabel(item.marks)}
            </Text>
          </View>
        </View>
      </View>

      <MathRichText content={item.body} textStyle={styles.itemBody} />
      <QuestionMediaGallery imageUrls={item.questionImageUrls} />

      {item.options.length > 0 && usesChoiceOptions(item.questionType) ? (
        <View style={styles.optionsWrap}>
          {item.options.map((option, index) => {
            const optionValue = option.label?.trim() || option.text;
            const selected = optionValue.trim() === answerValue.trim();
            const optionLabel = option.label?.trim();
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
                <View style={styles.optionChipRow}>
                  {optionLabel ? (
                    <Text style={styles.optionChipPrefix}>{optionLabel}.</Text>
                  ) : null}
                  <View style={styles.optionChipContent}>
                    <MathRichText
                      content={option.text}
                      renderMode="auto"
                      touchThrough
                      textStyle={styles.optionChipLabel}
                    />
                  </View>
                </View>
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
          onChange={next => onAnswerChange(stringifyMatchingAnswer(next))}
        />
      ) : usesTextAnswerInput(item.questionType) ? (
        <TextInput
          editable={!isCompleted}
          multiline
          placeholder={t("session.typeYourAnswer")}
          placeholderTextColor="#94A3B8"
          style={[
            styles.answerInput,
            isCompleted && styles.answerInputReadonly,
          ]}
          value={answerValue}
          onChangeText={onAnswerChange}
        />
      ) : null}

      {isCompleted ? (
        <View style={styles.resultBlock}>
          <Text
            style={[
              styles.resultStatus,
              item.isCorrect ? styles.resultCorrect : styles.resultWrong,
            ]}
          >
            {item.isCorrect ? t("session.correct") : t("session.incorrect")}
          </Text>
          <ResultRow
            label={t("session.yourAnswer")}
            value={submittedAnswerDisplay}
          />
          <ResultRow
            label={t("session.expected")}
            value={expectedAnswerDisplay}
          />
          {item.explanation ? (
            <MathRichText
              content={item.explanation}
              textStyle={styles.explanationText}
            />
          ) : null}
          <QuestionMediaGallery imageUrls={item.solutionImageUrls} />
        </View>
      ) : null}
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <MathRichText content={value} textStyle={styles.resultText} />
    </View>
  );
}

type MatchingAnswerEditorProps = {
  leftKeys: string[];
  rightChoices: string[];
  pairs: Record<string, string>;
  readOnly: boolean;
  onChange: (next: Record<string, string>) => void;
};

function MatchingAnswerEditor({
  leftKeys,
  rightChoices,
  pairs,
  readOnly,
  onChange,
}: MatchingAnswerEditorProps) {
  const { t } = useTranslation("practice");
  const [selectedLeft, setSelectedLeft] = useState("");
  const normalizedLeftSet = useMemo(
    () => new Set(leftKeys.map(left => left.trim().toLowerCase())),
    [leftKeys]
  );
  const displayRightChoices = useMemo(() => {
    const filtered = rightChoices.filter(
      choice => !normalizedLeftSet.has(choice.trim().toLowerCase())
    );
    return filtered.length >= Math.min(2, rightChoices.length)
      ? filtered
      : rightChoices;
  }, [normalizedLeftSet, rightChoices]);

  useEffect(() => {
    if (leftKeys.length === 0) {
      setSelectedLeft("");
      return;
    }
    setSelectedLeft(current => {
      if (current && leftKeys.includes(current)) return current;
      return leftKeys.find(left => !pairs[left]?.trim()) ?? leftKeys[0] ?? "";
    });
  }, [leftKeys, pairs]);

  const pairedCount = useMemo(
    () => leftKeys.filter(left => Boolean(pairs[left]?.trim())).length,
    [leftKeys, pairs]
  );
  const usedRightChoices = useMemo(
    () =>
      new Set(
        Object.entries(pairs)
          .filter(
            ([left, right]) => left !== selectedLeft && right.trim().length > 0
          )
          .map(([, right]) => right.trim())
      ),
    [pairs, selectedLeft]
  );

  const assignRightChoice = (right: string) => {
    if (!selectedLeft || readOnly) return;
    const next = { ...pairs };
    for (const [left, value] of Object.entries(next)) {
      if (left !== selectedLeft && value.trim() === right.trim())
        delete next[left];
    }
    next[selectedLeft] = right;
    onChange(next);
    setSelectedLeft(
      leftKeys.find(left => left !== selectedLeft && !next[left]?.trim()) ??
        selectedLeft
    );
  };

  const clearSelectedLeft = () => {
    if (!selectedLeft || readOnly || !pairs[selectedLeft]?.trim()) return;
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
            {t("session.matchingPairsCompleted", {
              count: pairedCount,
              total: leftKeys.length,
            })}
          </Text>
        </View>
        {selectedLeft ? (
          <Pressable
            disabled={readOnly || !pairs[selectedLeft]?.trim()}
            style={({ pressed }) => [
              styles.matchingClearChip,
              (readOnly || !pairs[selectedLeft]?.trim()) &&
                styles.buttonDisabled,
              pressed &&
                !readOnly &&
                Boolean(pairs[selectedLeft]?.trim()) &&
                styles.buttonPressed,
            ]}
            onPress={clearSelectedLeft}
          >
            <Text style={styles.matchingClearLabel}>
              {t("session.clearSelected")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {leftKeys.length === 0 || displayRightChoices.length === 0 ? (
        <Text style={styles.matchingHint}>
          {t("session.noMatchingOptions")}
        </Text>
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
                    <Text
                      style={
                        assignedRight
                          ? styles.matchingPromptStatus
                          : styles.matchingPromptPending
                      }
                    >
                      {assignedRight
                        ? t("session.paired")
                        : t("session.waiting")}
                    </Text>
                  </View>
                  <MathRichText
                    content={left}
                    inline
                    renderMode="auto"
                    touchThrough
                    textStyle={styles.matchingLeft}
                  />
                  <View style={styles.matchingAssignedBox}>
                    <Text style={styles.matchingAssignedLabel}>
                      {t("session.currentMatch")}
                    </Text>
                    <MathRichText
                      content={assignedRight || t("session.chooseFromBank")}
                      inline
                      renderMode="auto"
                      touchThrough
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
              {selectedLeft
                ? t("session.answerBank")
                : t("session.selectPromptToStart")}
            </Text>
            {selectedLeft ? (
              <MathRichText
                content={selectedLeft}
                inline
                textStyle={styles.matchingSelectedPrompt}
              />
            ) : null}
            {selectedLeft ? (
              <Text style={styles.matchingBankHint}>
                {t("session.answerBankHint")}
              </Text>
            ) : null}
            <View style={styles.matchingChoices}>
              {displayRightChoices.map(right => {
                const selectedRight = selectedLeft
                  ? pairs[selectedLeft]?.trim() === right
                  : false;
                const alreadyUsed = usedRightChoices.has(right.trim());
                return (
                  <Pressable
                    key={`matching-choice-${right}`}
                    disabled={readOnly || !selectedLeft}
                    style={({ pressed }) => [
                      styles.matchingChoiceChip,
                      selectedRight && styles.matchingChoiceChipActive,
                      alreadyUsed &&
                        !selectedRight &&
                        styles.matchingChoiceChipReassign,
                      pressed &&
                        !readOnly &&
                        selectedLeft &&
                        styles.buttonPressed,
                    ]}
                    onPress={() => assignRightChoice(right)}
                  >
                    <MathRichText
                      content={right}
                      inline
                      renderMode="auto"
                      touchThrough
                      textStyle={[
                        styles.matchingChoiceLabel,
                        selectedRight && styles.matchingChoiceLabelActive,
                        alreadyUsed &&
                          !selectedRight &&
                          styles.matchingChoiceLabelReassign,
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
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  itemHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemQuestionLabel: { color: "#0F172A", fontSize: 14, fontWeight: "800" },
  itemMetaCluster: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  itemMetaBadge: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemMetaBadgeLabel: { color: "#475569", fontSize: 11, fontWeight: "700" },
  itemBody: { color: "#1E293B", fontSize: 17, lineHeight: 28 },
  optionsWrap: { gap: 10 },
  optionChip: {
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionChipRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  optionChipPrefix: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    minWidth: 22,
  },
  optionChipContent: { flex: 1 },
  optionChipSelected: { backgroundColor: "#E0EAFF", borderColor: "#4F7DF3" },
  optionChipCorrect: { backgroundColor: "#DCFCE7", borderColor: "#16A34A" },
  optionChipLabel: { color: "#1E293B", fontSize: 14, lineHeight: 21 },
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
  answerInputReadonly: { opacity: 0.8 },
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
  matchingHeaderCopy: { flex: 1, gap: 3 },
  matchingTitle: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
  matchingHint: { color: "#64748B", fontSize: 12 },
  matchingPromptList: { gap: 8 },
  matchingPromptCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  matchingPromptCardSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  matchingPromptCardPaired: { borderColor: "#93C5FD" },
  matchingPromptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  matchingPromptIndex: { color: "#1D4ED8", fontSize: 12, fontWeight: "800" },
  matchingPromptStatus: { color: "#047857", fontSize: 11, fontWeight: "700" },
  matchingPromptPending: { color: "#B45309", fontSize: 11, fontWeight: "700" },
  matchingLeft: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
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
  matchingAssignedValue: { color: "#0F172A", fontSize: 12, fontWeight: "600" },
  matchingAssignedPlaceholder: { color: "#94A3B8", fontWeight: "500" },
  matchingAnswerBank: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  matchingBankTitle: { color: "#334155", fontSize: 12, fontWeight: "700" },
  matchingSelectedPrompt: { color: "#1D4ED8", fontSize: 12, fontWeight: "600" },
  matchingBankHint: { color: "#64748B", fontSize: 11 },
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
  matchingChoiceLabel: { color: "#334155", fontSize: 12, fontWeight: "600" },
  matchingChoiceLabelActive: { color: "#1D4ED8" },
  matchingChoiceLabelReassign: { color: "#B45309" },
  matchingClearChip: {
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchingClearLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  resultBlock: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  resultStatus: { fontSize: 12, fontWeight: "700" },
  resultCorrect: { color: "#15803D" },
  resultWrong: { color: "#B91C1C" },
  resultText: { color: "#334155", fontSize: 12, lineHeight: 18 },
  resultRow: { gap: 2 },
  resultLabel: { color: "#334155", fontSize: 12, fontWeight: "700" },
  explanationText: {
    color: "#0F172A",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.9 },
});
