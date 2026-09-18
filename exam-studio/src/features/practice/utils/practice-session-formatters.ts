import type { TFunction } from "i18next";

export const toPracticeQuestionTypeLabel = (value: string, t: TFunction) => {
  if (value === "mcq") return t("session.questionTypes.mcq");
  if (value === "true_false") return t("session.questionTypes.true_false");
  if (value === "short_answer") return t("session.questionTypes.short_answer");
  if (value === "long_answer") return t("session.questionTypes.long_answer");
  if (value === "fill_blank") return t("session.questionTypes.fill_blank");
  if (value === "matching") return t("session.questionTypes.matching");
  return value;
};

export const formatPracticeElapsed = (startedAt: string, nowTs: number) => {
  const deltaSeconds = Math.max(
    0,
    Math.floor((nowTs - new Date(startedAt).getTime()) / 1000)
  );
  const minutes = Math.floor(deltaSeconds / 60);
  const seconds = deltaSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

export const formatPracticeMarksLabel = (marks: number) =>
  `${marks} ${marks === 1 ? "mark" : "marks"}`;
