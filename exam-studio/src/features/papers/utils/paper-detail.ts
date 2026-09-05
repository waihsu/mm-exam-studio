import type { QuestionPaperItem } from "../types/papers.types";

type PaperConfirmActionKind = "remove-item" | "delete-paper" | "export-pdf";

export const getPaperConfirmationCopy = (
  kind: PaperConfirmActionKind | undefined,
  t: (key: string) => string
) => {
  if (kind === "delete-paper") {
    return {
      confirmLabel: t("papers:detail.deletePaper"),
      confirmTone: "danger" as const,
      hint: t("papers:detail.deleteHint"),
      message: t("papers:detail.deleteMessage"),
      title: t("papers:detail.deletePaper"),
    };
  }
  if (kind === "export-pdf") {
    return {
      confirmLabel: t("papers:detail.generatePdfExport"),
      confirmTone: "primary" as const,
      hint: t("papers:detail.exportConfirmHint"),
      message: t("papers:detail.exportConfirmMessage"),
      title: t("papers:detail.exportConfirmTitle"),
    };
  }
  return {
    confirmLabel: t("papers:detail.removeQuestion"),
    confirmTone: "primary" as const,
    hint: t("papers:detail.removeHint"),
    message: t("papers:detail.removeMessage"),
    title: t("papers:detail.removeQuestion"),
  };
};

export const getPaperQuestionTypeLabelKey = (value: string) => {
  if (value === "mcq") return "papers:questionTypes.mcq";
  if (value === "true_false") return "papers:questionTypes.trueFalse";
  if (value === "short_answer") return "papers:questionTypes.shortAnswer";
  if (value === "long_answer") return "papers:questionTypes.longAnswer";
  if (value === "fill_blank") return "papers:questionTypes.fillBlank";
  if (value === "matching") return "papers:questionTypes.matching";
  return value;
};

export const normalizePaperOptionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const buildReorderedPaperItemIds = (
  items: QuestionPaperItem[],
  itemId: string,
  direction: "up" | "down"
) => {
  const currentIndex = items.findIndex(item => item.id === itemId);
  if (currentIndex < 0) return null;
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return null;
  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(currentIndex, 1);
  reorderedItems.splice(nextIndex, 0, movedItem);
  return reorderedItems.map(item => item.id);
};

const parseMatchingPairsFromText = (rawValue: string | null | undefined) => {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>(
        (next, [left, right]) => {
          if (typeof right !== "string") return next;
          const normalizedLeft = left.trim();
          const normalizedRight = right.trim();
          if (normalizedLeft && normalizedRight)
            next[normalizedLeft] = normalizedRight;
          return next;
        },
        {}
      );
    }
  } catch {
    // Plain-text matching answers use the `left:right|left:right` fallback below.
  }
  return trimmed.split("|").reduce<Record<string, string>>((next, segment) => {
    const [left, right] = segment
      .split(":", 2)
      .map(value => value?.trim() ?? "");
    if (left && right) next[left] = right;
    return next;
  }, {});
};

export const formatPaperAnswerForDisplay = (item: QuestionPaperItem) => {
  if (item.questionType !== "matching") return item.answerText ?? "";
  const optionPairs = item.options
    .map(option => ({
      left: option.label?.trim() ?? "",
      right: option.text.trim(),
    }))
    .filter(pair => pair.left.length > 0 && pair.right.length > 0);
  if (optionPairs.length > 0) {
    return optionPairs
      .map((pair, index) => `${index + 1}. ${pair.left} -> ${pair.right}`)
      .join("\n");
  }
  const parsedEntries = Object.entries(
    parseMatchingPairsFromText(item.answerText)
  );
  if (parsedEntries.length > 0) {
    return parsedEntries
      .map(([left, right], index) => `${index + 1}. ${left} -> ${right}`)
      .join("\n");
  }
  return item.answerText ?? "";
};
