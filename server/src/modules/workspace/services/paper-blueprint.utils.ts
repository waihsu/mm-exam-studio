import { inArray } from "drizzle-orm";
import { question } from "@/db";
import type {
  PaperBlueprintDifficultyDistribution,
  PaperBlueprintPlanCode,
  PaperBlueprintPresetConfig,
  PaperBlueprintTemplateConfig,
  PaperPdfTemplateKey,
} from "../paper-blueprint.schema";

export type QuestionDifficultyBucket = "easy" | "normal" | "hard" | "advance";

type BlueprintPreviewIssueCode =
  | "locked_question_duplicate"
  | "slot_insufficient_matches"
  | "all_type_missing_sections"
  | "mcq_only_insufficient_matches"
  | "section_missing_configuration"
  | "section_insufficient_matches";

export const dedupe = <T,>(values: Array<T | null | undefined>) =>
  [...new Set(values.filter((value): value is T => value !== null && value !== undefined))];

export const normalizePdfTemplateKey = (value: string | null | undefined): PaperPdfTemplateKey =>
  value === "myanmar_matric" ? "myanmar_matric" : "default";

export const normalizePresetConfig = (value: unknown): PaperBlueprintPresetConfig => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    ...record,
    chapterIds: Array.isArray(record.chapterIds)
      ? record.chapterIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : undefined,
    subChapterIds: Array.isArray(record.subChapterIds)
      ? record.subChapterIds.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : undefined,
  };
};

export const normalizeTemplateConfig = (value: unknown): PaperBlueprintTemplateConfig => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { isPublished: false, availablePlanCodes: [] };
  }

  const record = value as Record<string, unknown>;
  const availablePlanCodes = Array.isArray(record.availablePlanCodes)
    ? [
        ...new Set(
          record.availablePlanCodes.filter(
            (item): item is PaperBlueprintPlanCode =>
              item === "free" || item === "pro" || item === "premium",
          ),
        ),
      ]
    : [];

  return { isPublished: record.isPublished === true, availablePlanCodes };
};

export const allocationOrder: QuestionDifficultyBucket[] = ["advance", "hard", "normal", "easy"];

export const allocateDifficultyCounts = (
  total: number,
  distribution: PaperBlueprintDifficultyDistribution,
): Record<QuestionDifficultyBucket, number> => {
  const rawEntries = allocationOrder.map((bucket) => ({
    bucket,
    exact: (distribution[bucket] / 100) * total,
  }));

  const base = Object.fromEntries(
    rawEntries.map((entry) => [entry.bucket, Math.floor(entry.exact)]),
  ) as Record<QuestionDifficultyBucket, number>;

  let assigned = Object.values(base).reduce((sum, count) => sum + count, 0);
  const byRemainder = [...rawEntries].sort((left, right) => {
    const remainderDiff = right.exact - Math.floor(right.exact) - (left.exact - Math.floor(left.exact));
    if (remainderDiff !== 0) return remainderDiff;
    return allocationOrder.indexOf(left.bucket) - allocationOrder.indexOf(right.bucket);
  });

  let pointer = 0;
  while (assigned < total) {
    const target = byRemainder[pointer % byRemainder.length];
    base[target.bucket] += 1;
    assigned += 1;
    pointer += 1;
  }

  return base;
};

export const toQuestionDifficulty = (value: QuestionDifficultyBucket | null) => {
  if (value === "easy") return "easy";
  if (value === "normal") return "medium";
  if (value === "hard" || value === "advance") return "hard";
  return undefined;
};

export const buildPresetExtraConditions = (
  config: PaperBlueprintPresetConfig,
  overrides: { chapterId?: string | null; subChapterId?: string | null } = {},
) => {
  const chapterIds = overrides.chapterId ? [overrides.chapterId] : dedupe(config.chapterIds ?? []);
  const subChapterIds = overrides.subChapterId
    ? [overrides.subChapterId]
    : dedupe(config.subChapterIds ?? []);

  return [
    chapterIds.length > 0 ? inArray(question.chapterId, chapterIds) : undefined,
    subChapterIds.length > 0 ? inArray(question.subChapterId, subChapterIds) : undefined,
  ];
};

export const summarizeGeneratedPaper = (paper: {
  id: string;
  title: string;
  status: "draft" | "finalized";
  totalQuestions: number;
  totalMarks: number;
  exportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: paper.id,
  title: paper.title,
  status: paper.status,
  totalQuestions: paper.totalQuestions,
  totalMarks: paper.totalMarks,
  exportedAt: paper.exportedAt,
  createdAt: paper.createdAt,
  updatedAt: paper.updatedAt,
});

export const createPreviewIssue = (params: {
  code: BlueprintPreviewIssueCode;
  message: string;
  sectionCode?: string | null;
  slotNumber?: number | null;
  details?: Record<string, unknown>;
}) => ({
  code: params.code,
  message: params.message,
  sectionCode: params.sectionCode ?? null,
  slotNumber: params.slotNumber ?? null,
  details: params.details ?? null,
});
