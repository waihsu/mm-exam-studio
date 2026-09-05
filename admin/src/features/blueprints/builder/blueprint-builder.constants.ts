import type {
  PaperBlueprintDifficulty,
  PaperBlueprintMode,
  PaperBlueprintPlanCode,
  PaperBlueprintQuestionType,
  PaperPdfTemplateKey,
} from "../types";

export const blueprintModeGuidance: Record<
  PaperBlueprintMode,
  {
    title: string;
    description: string;
  }
> = {
  mcq_only: {
    title: "Fastest setup",
    description:
      "Use difficulty + chapter filters only. No sections or slots are required unless you want tighter control.",
  },
  all_type: {
    title: "Balanced preset paper",
    description:
      "Define sections by question type and marks, then let the backend fill each section from the eligible bank.",
  },
  custom: {
    title: "Full slot-by-slot control",
    description:
      "Define exact slots for each question position, including difficulty targets, swap limits, and optional locked questions.",
  },
};

export const blueprintDifficultyPresets = [
  {
    key: "balanced",
    label: "Balanced",
    values: { easy: "40", normal: "30", hard: "20", advance: "10" },
  },
  {
    key: "easier",
    label: "Easier",
    values: { easy: "50", normal: "30", hard: "15", advance: "5" },
  },
  {
    key: "harder",
    label: "Harder",
    values: { easy: "25", normal: "45", hard: "20", advance: "10" },
  },
] as const;

export const blueprintQuestionTypeOptions: Array<{
  value: PaperBlueprintQuestionType;
  label: string;
}> = [
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True / false" },
  { value: "fill_blank", label: "Fill blank" },
  { value: "short_answer", label: "Short answer" },
  { value: "matching", label: "Matching" },
  { value: "long_answer", label: "Long answer" },
];

export const blueprintMarkOptions = [1, 2, 3, 5, 10] as const;

export const blueprintDifficultyOptions: Array<{
  value: PaperBlueprintDifficulty;
  label: string;
}> = [
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "advance", label: "Advance" },
];

export const blueprintPlanOptions: Array<{
  value: PaperBlueprintPlanCode;
  label: string;
  description: string;
}> = [
  { value: "free", label: "Free", description: "Visible to starter users." },
  { value: "pro", label: "Pro", description: "Visible to Pro subscribers." },
  { value: "premium", label: "Premium", description: "Visible to Premium subscribers." },
];

export const blueprintPdfTemplateOptions: Array<{
  value: PaperPdfTemplateKey;
  label: string;
  description: string;
}> = [
  {
    value: "default",
    label: "Default",
    description: "General clean paper layout for any subject.",
  },
  {
    value: "myanmar_matric",
    label: "Myanmar Matric",
    description: "Formal exam-paper header, serif typography, and section-first layout.",
  },
];
