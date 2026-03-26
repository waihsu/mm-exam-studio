import type { SymbolView } from "expo-symbols";
import type { PaperQuestionType } from "../types/papers.types";

export const PAPER_MIX_TYPES: PaperQuestionType[] = [
  "mcq",
  "true_false",
  "fill_blank",
  "short_answer",
  "matching",
  "long_answer",
];

export const PAPER_GUIDE_STEPS: Array<{
  titleKey: string;
  hintKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
}> = [
  {
    titleKey: "papers:home.guidePickTitle",
    hintKey: "papers:home.guidePickHint",
    icon: { ios: "checklist", android: "checklist", web: "checklist" },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    titleKey: "papers:home.guideReviewTitle",
    hintKey: "papers:home.guideReviewHint",
    icon: { ios: "list.bullet.rectangle.portrait", android: "view_list", web: "view_list" },
    accentColor: "#047857",
    accentSoft: "#DCFCE7",
  },
  {
    titleKey: "papers:home.guideCreateTitle",
    hintKey: "papers:home.guideCreateHint",
    icon: { ios: "doc.badge.plus", android: "note_add", web: "note_add" },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
  },
  {
    titleKey: "papers:home.guideFinalizeTitle",
    hintKey: "papers:home.guideFinalizeHint",
    icon: { ios: "printer.fill", android: "print", web: "print" },
    accentColor: "#7C3AED",
    accentSoft: "#EDE9FE",
  },
];

export const EMPTY_PAPER_MIX_COUNTS: Record<PaperQuestionType, string> = {
  mcq: "0",
  true_false: "0",
  short_answer: "0",
  long_answer: "0",
  fill_blank: "0",
  matching: "0",
};

export const toPaperStatusLabel = (
  status: "draft" | "finalized",
  exportedAt: string | null,
) => {
  if (exportedAt) return "papers:status.exported";
  return status;
};

export const toPaperQuestionTypeLabelKey = (value: PaperQuestionType) => {
  if (value === "mcq") return "papers:questionTypes.mcq";
  if (value === "true_false") return "papers:questionTypes.trueFalse";
  if (value === "short_answer") return "papers:questionTypes.shortAnswer";
  if (value === "long_answer") return "papers:questionTypes.longAnswer";
  if (value === "fill_blank") return "papers:questionTypes.fillBlank";
  if (value === "matching") return "papers:questionTypes.matching";
  return value;
};
