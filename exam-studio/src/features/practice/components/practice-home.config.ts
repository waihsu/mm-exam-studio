import type { SymbolView } from "expo-symbols";
import type { PracticeQuestionType } from "../types/practice.types";

export const PRACTICE_EXCLUDED_TYPES: PracticeQuestionType[] = ["long_answer"];

export const PRACTICE_MIX_TYPES: PracticeQuestionType[] = [
  "mcq",
  "true_false",
  "fill_blank",
  "short_answer",
  "matching",
];

export const PRACTICE_GUIDE_STEPS: Array<{
  titleKey: string;
  hintKey: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
}> = [
  {
    titleKey: "practice:home.guideFilterTitle",
    hintKey: "practice:home.guideFilterHint",
    icon: {
      ios: "line.3.horizontal.decrease.circle.fill",
      android: "filter_alt",
      web: "filter_alt",
    },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
  },
  {
    titleKey: "practice:home.guideSelectTitle",
    hintKey: "practice:home.guideSelectHint",
    icon: {
      ios: "checkmark.circle.fill",
      android: "check_circle",
      web: "check_circle",
    },
    accentColor: "#047857",
    accentSoft: "#DCFCE7",
  },
  {
    titleKey: "practice:home.guideQuickStartTitle",
    hintKey: "practice:home.guideQuickStartHint",
    icon: {
      ios: "play.circle.fill",
      android: "play_circle",
      web: "play_circle",
    },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
  },
  {
    titleKey: "practice:home.guideResumeTitle",
    hintKey: "practice:home.guideResumeHint",
    icon: {
      ios: "clock.arrow.circlepath",
      android: "history",
      web: "history",
    },
    accentColor: "#7C3AED",
    accentSoft: "#EDE9FE",
  },
];

export const toPracticeQuestionTypeLabelKey = (value: string) => {
  if (value === "mcq") return "practice:questionTypes.mcq";
  if (value === "true_false") return "practice:questionTypes.trueFalse";
  if (value === "short_answer") return "practice:questionTypes.shortAnswer";
  if (value === "long_answer") return "practice:questionTypes.longAnswer";
  if (value === "fill_blank") return "practice:questionTypes.fillBlank";
  if (value === "matching") return "practice:questionTypes.matching";
  return value;
};

export const EMPTY_PRACTICE_MIX_COUNTS: Record<PracticeQuestionType, string> = {
  mcq: "0",
  true_false: "0",
  short_answer: "0",
  long_answer: "0",
  fill_blank: "0",
  matching: "0",
};

export const PRACTICE_PRESETS: Array<{
  key: "fast_mcq" | "mixed_core" | "revision_set";
  labelKey: string;
  values: Record<PracticeQuestionType, string>;
}> = [
  {
    key: "fast_mcq",
    labelKey: "practice:home.presets.fastMcq",
    values: {
      ...EMPTY_PRACTICE_MIX_COUNTS,
      mcq: "10",
    },
  },
  {
    key: "mixed_core",
    labelKey: "practice:home.presets.mixedCore",
    values: {
      ...EMPTY_PRACTICE_MIX_COUNTS,
      mcq: "6",
      true_false: "4",
      fill_blank: "4",
      short_answer: "3",
    },
  },
  {
    key: "revision_set",
    labelKey: "practice:home.presets.revisionSet",
    values: {
      ...EMPTY_PRACTICE_MIX_COUNTS,
      mcq: "8",
      true_false: "4",
      fill_blank: "4",
      short_answer: "4",
      matching: "1",
    },
  },
];

export const formatPracticeScore = (value: number | null) => {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(1)}%`;
};
