import { asc, eq } from "drizzle-orm";
import {
  chapter,
  db,
  grade,
  gradeSubject,
  subject,
  subChapter,
} from "@/db";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type QuestionMetaPayload = {
  grades: Array<{ id: string; code: string; name: string }>;
  subjects: Array<{ id: string; code: string; name: string }>;
  gradeSubjects: Array<{ gradeId: string; subjectId: string }>;
  chapters: Array<{
    id: string;
    code: string | null;
    name: string;
    gradeId: string;
    subjectId: string;
    isFreePreview: boolean;
  }>;
  subChapters: Array<{
    id: string;
    code: string | null;
    name: string;
    chapterId: string;
    isFreePreview: boolean;
  }>;
};

const readPositiveMs = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const QUESTION_META_CACHE_MS = readPositiveMs(
  process.env.QUESTION_META_CACHE_MS,
  20_000,
);

let questionMetaCache: CacheEntry<QuestionMetaPayload> | null = null;

export const clearQuestionMetaCache = () => {
  questionMetaCache = null;
};

const fetchQuestionMeta = async () => {
  const [grades, subjects, gradeSubjects, chapters, subChapters] =
    await Promise.all([
      db.query.grade.findMany({
        where: eq(grade.isActive, true),
        orderBy: (table) => [asc(table.sortOrder), asc(table.name)],
        columns: { id: true, code: true, name: true },
      }),
      db.query.subject.findMany({
        where: eq(subject.isActive, true),
        orderBy: (table) => [asc(table.name)],
        columns: { id: true, code: true, name: true },
      }),
      db.query.gradeSubject.findMany({
        where: eq(gradeSubject.isActive, true),
        orderBy: (table) => [asc(table.sortOrder)],
        columns: { gradeId: true, subjectId: true },
      }),
      db.query.chapter.findMany({
        where: eq(chapter.isActive, true),
        orderBy: (table) => [asc(table.sortOrder), asc(table.name)],
        columns: {
          id: true,
          code: true,
          name: true,
          gradeId: true,
          subjectId: true,
          isFreePreview: true,
        },
      }),
      db.query.subChapter.findMany({
        where: eq(subChapter.isActive, true),
        orderBy: (table) => [asc(table.sortOrder), asc(table.name)],
        columns: {
          id: true,
          code: true,
          name: true,
          chapterId: true,
          isFreePreview: true,
        },
      }),
    ]);

  return {
    grades,
    subjects,
    gradeSubjects,
    chapters,
    subChapters,
  };
};

export const getQuestionMeta = async () => {
  const now = Date.now();
  if (questionMetaCache && questionMetaCache.expiresAt > now) {
    return questionMetaCache.value;
  }

  const value = await fetchQuestionMeta();
  questionMetaCache = {
    value,
    expiresAt: now + QUESTION_META_CACHE_MS,
  };
  return value;
};
