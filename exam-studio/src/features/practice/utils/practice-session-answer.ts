import type { PracticeSessionItem } from "../types/practice.types";
import { parseMatchingAnswer } from "./matching-answer";

export const usesChoiceOptions = (questionType: PracticeSessionItem["questionType"]) =>
  questionType === "mcq" || questionType === "true_false";

export const usesTextAnswerInput = (questionType: PracticeSessionItem["questionType"]) =>
  questionType === "short_answer" ||
  questionType === "long_answer" ||
  questionType === "fill_blank";

export const getMatchingLeftKeys = (item: PracticeSessionItem) => {
  if (item.questionType !== "matching") return [] as string[];
  const keys = item.options.map((option, index) => option.label?.trim() || `Item ${index + 1}`);
  return Array.from(new Set(keys));
};

export const isPracticeItemAnswered = (item: PracticeSessionItem, rawAnswer: string) => {
  const answer = rawAnswer.trim();
  if (item.questionType !== "matching") return answer.length > 0;

  const leftKeys = getMatchingLeftKeys(item);
  if (leftKeys.length === 0) return answer.length > 0;

  const pairs = parseMatchingAnswer(answer);
  return leftKeys.every((left) => Boolean(pairs[left]?.trim()));
};

export const formatMatchingAnswerForDisplay = (
  rawValue: string | null | undefined,
  leftKeys: string[],
) => {
  const pairs = parseMatchingAnswer(rawValue);
  const orderedPairs: Array<{ left: string; right: string }> = [];
  const seenLeft = new Set<string>();

  for (const left of leftKeys) {
    const right = pairs[left]?.trim();
    if (!right) continue;
    orderedPairs.push({ left, right });
    seenLeft.add(left.trim().toLowerCase());
  }

  for (const [left, rightRaw] of Object.entries(pairs)) {
    const right = rightRaw.trim();
    if (!right || seenLeft.has(left.trim().toLowerCase())) continue;
    orderedPairs.push({ left, right });
  }

  if (orderedPairs.length === 0) {
    const fallback = String(rawValue ?? "").trim();
    return fallback || "-";
  }

  return orderedPairs.map((pair, index) => `${index + 1}. ${pair.left} -> ${pair.right}`).join("\n");
};
