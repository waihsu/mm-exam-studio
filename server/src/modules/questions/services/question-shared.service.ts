import { and, eq } from "drizzle-orm";
import { chapter, db, gradeSubject, subChapter } from "@/db";
import type { CreateQuestionInput, QuestionVariableInput } from "../question.schema";

export type QuestionReviewStatus = "draft" | "in_review" | "needs_changes" | "approved";

export const toVariableDefinitions = (
  value: unknown,
): QuestionVariableInput[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as QuestionVariableInput[];
};

const ensureGradeSubjectLink = async (gradeId: string, subjectId: string) => {
  const linkedGradeSubject = await db.query.gradeSubject.findFirst({
    where: and(
      eq(gradeSubject.gradeId, gradeId),
      eq(gradeSubject.subjectId, subjectId),
    ),
    columns: {
      isActive: true,
    },
  });

  if (!linkedGradeSubject) {
    throw new Error("Selected subject is not linked to the selected grade.");
  }

  if (!linkedGradeSubject.isActive) {
    throw new Error("Selected grade and subject link is inactive.");
  }
};

const ensureChapterMatches = async (params: {
  gradeId: string;
  subjectId: string;
  chapterId?: string | null;
}) => {
  if (!params.chapterId) {
    return null;
  }

  const chapterRecord = await db.query.chapter.findFirst({
    where: eq(chapter.id, params.chapterId),
    columns: {
      id: true,
      gradeId: true,
      subjectId: true,
      isActive: true,
    },
  });

  if (!chapterRecord) {
    throw new Error("Selected chapter was not found.");
  }

  if (!chapterRecord.isActive) {
    throw new Error("Selected chapter is inactive.");
  }

  if (
    chapterRecord.gradeId !== params.gradeId ||
    chapterRecord.subjectId !== params.subjectId
  ) {
    throw new Error(
      "Selected chapter does not belong to the selected grade and subject.",
    );
  }

  return chapterRecord;
};

const ensureSubChapterMatches = async (params: {
  chapterId?: string | null;
  subChapterId?: string | null;
}) => {
  if (!params.subChapterId) {
    return;
  }

  if (!params.chapterId) {
    throw new Error("Select a chapter before choosing a sub chapter.");
  }

  const subChapterRecord = await db.query.subChapter.findFirst({
    where: eq(subChapter.id, params.subChapterId),
    columns: {
      chapterId: true,
      isActive: true,
    },
  });

  if (!subChapterRecord) {
    throw new Error("Selected sub chapter was not found.");
  }

  if (!subChapterRecord.isActive) {
    throw new Error("Selected sub chapter is inactive.");
  }

  if (subChapterRecord.chapterId !== params.chapterId) {
    throw new Error(
      "Selected sub chapter does not belong to the selected chapter.",
    );
  }
};

export const validateQuestionRelations = async (params: {
  gradeId: string;
  subjectId: string;
  chapterId?: string | null;
  subChapterId?: string | null;
}) => {
  await ensureGradeSubjectLink(params.gradeId, params.subjectId);
  const chapterRecord = await ensureChapterMatches(params);
  await ensureSubChapterMatches({
    chapterId: chapterRecord?.id ?? params.chapterId,
    subChapterId: params.subChapterId,
  });
};

export const assertPublishState = (params: {
  isPublished?: boolean;
  reviewStatus?: QuestionReviewStatus;
}) => {
  if (params.isPublished && params.reviewStatus !== "approved") {
    throw new Error("Only approved questions can be published.");
  }
};

export const normalizeReviewStatus = (params: {
  isPublished: boolean;
  reviewStatus?: QuestionReviewStatus;
  fallback: QuestionReviewStatus;
}) => {
  if (params.isPublished) {
    return params.reviewStatus ?? "approved";
  }
  return params.reviewStatus ?? params.fallback;
};

export const toQuestionOptionsInput = (input: {
  options: {
    label: string | null;
    text: string;
    isCorrect: boolean;
  }[];
}) =>
  input.options.map((option) => ({
    label: option.label ?? undefined,
    text: option.text,
    isCorrect: option.isCorrect,
  })) satisfies CreateQuestionInput["options"];
