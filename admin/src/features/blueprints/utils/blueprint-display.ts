import type {
  PaperBlueprintMode,
  PaperBlueprintPreviewIssue,
  PaperBlueprintStatus,
} from "../types";

export const formatBlueprintDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Not generated yet";

export const toPlainBlueprintPreview = (
  value: string | null | undefined,
  maxLength = 180,
) => {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
};

export const blueprintModeLabel: Record<PaperBlueprintMode, string> = {
  custom: "Custom",
  mcq_only: "MCQ only",
  all_type: "All type",
};

export const blueprintStatusLabel: Record<PaperBlueprintStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  archived: "Archived",
};

export const blueprintStatusTone: Record<PaperBlueprintStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-amber-200 bg-amber-50 text-amber-700",
};

export const blueprintIssueTone = (issue: PaperBlueprintPreviewIssue) => {
  if (issue.code === "locked_question_duplicate") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-rose-200 bg-rose-50 text-rose-900";
};

