import { and, asc, count, eq, inArray, sql } from "drizzle-orm";

import {
  chapter,
  db,
  grade,
  gradeSubject,
  question,
  subChapter,
  subject,
} from "@/db";
import type {
  CreateChapterInput,
  CreateGradeInput,
  CreateSubjectInput,
  CreateSubChapterInput,
  UpdateChapterInput,
  UpdateGradeInput,
  UpdateSubjectInput,
  UpdateSubChapterInput,
} from "./taxonomy.schema";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type PaginationParams = {
  page?: number;
  pageSize?: number;
};

const normalizePagination = (params: PaginationParams) => {
  const page =
    Number.isFinite(params.page) && (params.page ?? 0) > 0
      ? Math.trunc(params.page as number)
      : DEFAULT_PAGE;
  const requestedPageSize =
    Number.isFinite(params.pageSize) && (params.pageSize ?? 0) > 0
      ? Math.trunc(params.pageSize as number)
      : DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};

const uniqueIds = (ids: string[]) => [...new Set(ids.filter(Boolean))];

const createCountMap = <T extends Record<string, number>>(
  rows: Array<{ id: string } & T>,
  keys: Array<keyof T>,
) => {
  const map = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const entry: Record<string, number> = {};
    for (const key of keys) {
      entry[String(key)] = row[key] ?? 0;
    }
    map.set(row.id, entry);
  }
  return map;
};

const attachCount = <T extends { id: string }>(
  rows: T[],
  counts: Map<string, Record<string, number>>,
  defaults: Record<string, number>,
) =>
  rows.map((row) => ({
    ...row,
    _count: counts.get(row.id) ?? defaults,
  }));

const createSubjectGradeLinks = async (params: {
  subjectId: string;
  gradeIds: string[];
}) => {
  const gradeIds = uniqueIds(params.gradeIds);
  if (!gradeIds.length) return;

  await db
    .insert(gradeSubject)
    .values(
      gradeIds.map((gradeId, index) => ({
        gradeId,
        subjectId: params.subjectId,
        sortOrder: index,
        isActive: true,
      })),
    )
    .onConflictDoNothing({
      target: [gradeSubject.gradeId, gradeSubject.subjectId],
    });
};

const replaceSubjectGradeLinks = async (params: {
  subjectId: string;
  gradeIds: string[];
}) => {
  await db.delete(gradeSubject).where(eq(gradeSubject.subjectId, params.subjectId));
  await createSubjectGradeLinks(params);
};

const getGradeCountMap = async (gradeIds: string[]) => {
  const ids = uniqueIds(gradeIds);
  if (!ids.length) return new Map<string, Record<string, number>>();

  const [gradeSubjectCounts, chapterCounts, questionCounts] = await Promise.all([
    db
      .select({
        id: gradeSubject.gradeId,
        gradeSubjects: count(),
      })
      .from(gradeSubject)
      .where(inArray(gradeSubject.gradeId, ids))
      .groupBy(gradeSubject.gradeId),
    db
      .select({
        id: chapter.gradeId,
        chapters: count(),
      })
      .from(chapter)
      .where(inArray(chapter.gradeId, ids))
      .groupBy(chapter.gradeId),
    db
      .select({
        id: question.gradeId,
        questions: count(),
      })
      .from(question)
      .where(inArray(question.gradeId, ids))
      .groupBy(question.gradeId),
  ]);

  const map = new Map<string, Record<string, number>>();
  for (const id of ids) {
    map.set(id, { gradeSubjects: 0, chapters: 0, questions: 0 });
  }
  for (const row of gradeSubjectCounts) {
    map.get(row.id)!.gradeSubjects = row.gradeSubjects;
  }
  for (const row of chapterCounts) {
    map.get(row.id)!.chapters = row.chapters;
  }
  for (const row of questionCounts) {
    map.get(row.id)!.questions = row.questions;
  }
  return map;
};

const getSubjectCountMap = async (subjectIds: string[]) => {
  const ids = uniqueIds(subjectIds);
  if (!ids.length) return new Map<string, Record<string, number>>();

  const [gradeSubjectCounts, chapterCounts, questionCounts] = await Promise.all([
    db
      .select({
        id: gradeSubject.subjectId,
        gradeSubjects: count(),
      })
      .from(gradeSubject)
      .where(inArray(gradeSubject.subjectId, ids))
      .groupBy(gradeSubject.subjectId),
    db
      .select({
        id: chapter.subjectId,
        chapters: count(),
      })
      .from(chapter)
      .where(inArray(chapter.subjectId, ids))
      .groupBy(chapter.subjectId),
    db
      .select({
        id: question.subjectId,
        questions: count(),
      })
      .from(question)
      .where(inArray(question.subjectId, ids))
      .groupBy(question.subjectId),
  ]);

  const map = new Map<string, Record<string, number>>();
  for (const id of ids) {
    map.set(id, { gradeSubjects: 0, chapters: 0, questions: 0 });
  }
  for (const row of gradeSubjectCounts) {
    map.get(row.id)!.gradeSubjects = row.gradeSubjects;
  }
  for (const row of chapterCounts) {
    map.get(row.id)!.chapters = row.chapters;
  }
  for (const row of questionCounts) {
    map.get(row.id)!.questions = row.questions;
  }
  return map;
};

const getChapterCountMap = async (chapterIds: string[]) => {
  const ids = uniqueIds(chapterIds);
  if (!ids.length) return new Map<string, Record<string, number>>();

  const [subChapterCounts, questionCounts] = await Promise.all([
    db
      .select({
        id: subChapter.chapterId,
        subChapters: count(),
      })
      .from(subChapter)
      .where(inArray(subChapter.chapterId, ids))
      .groupBy(subChapter.chapterId),
    db
      .select({
        id: question.chapterId,
        questions: count(),
      })
      .from(question)
      .where(inArray(question.chapterId, ids))
      .groupBy(question.chapterId),
  ]);

  const map = new Map<string, Record<string, number>>();
  for (const id of ids) {
    map.set(id, { subChapters: 0, questions: 0 });
  }
  for (const row of subChapterCounts) {
    if (row.id) map.get(row.id)!.subChapters = row.subChapters;
  }
  for (const row of questionCounts) {
    if (row.id) map.get(row.id)!.questions = row.questions;
  }
  return map;
};

const getSubChapterCountMap = async (subChapterIds: string[]) => {
  const ids = uniqueIds(subChapterIds);
  if (!ids.length) return new Map<string, Record<string, number>>();

  const questionCounts = await db
    .select({
      id: question.subChapterId,
      questions: count(),
    })
    .from(question)
    .where(inArray(question.subChapterId, ids))
    .groupBy(question.subChapterId);

  const map = new Map<string, Record<string, number>>();
  for (const id of ids) {
    map.set(id, { questions: 0 });
  }
  for (const row of questionCounts) {
    if (row.id) map.get(row.id)!.questions = row.questions;
  }
  return map;
};

const selectTotal = async (table: typeof grade | typeof subject | typeof chapter | typeof subChapter) => {
  const [row] = await db.select({ total: count() }).from(table);
  return row?.total ?? 0;
};

export const taxonomyRepo = {
  getMeta: async () => {
    const [grades, subjects, chapters] = await Promise.all([
      db.query.grade.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        columns: { id: true, code: true, name: true },
      }),
      db.query.subject.findMany({
        orderBy: (table, { asc }) => [asc(table.name)],
        columns: { id: true, code: true, name: true },
        with: {
          gradeSubjects: {
            orderBy: (table, { asc }) => [asc(table.sortOrder)],
            columns: { gradeId: true },
          },
        },
      }),
      db.query.chapter.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        columns: {
          id: true,
          code: true,
          name: true,
          gradeId: true,
          subjectId: true,
        },
        with: {
          grade: {
            columns: { id: true, code: true, name: true },
          },
          subject: {
            columns: { id: true, code: true, name: true },
          },
        },
      }),
    ]);

    return [grades, subjects, chapters] as const;
  },

  getOverview: async () => {
    const [grades, subjects, chapters, subChapters] = await Promise.all([
      db.query.grade.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
      }),
      db.query.subject.findMany({
        orderBy: (table, { asc }) => [asc(table.name)],
        with: {
          gradeSubjects: {
            orderBy: (table, { asc }) => [asc(table.sortOrder)],
            with: {
              grade: {
                columns: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
      db.query.chapter.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        with: {
          grade: { columns: { id: true, code: true, name: true } },
          subject: { columns: { id: true, code: true, name: true } },
        },
      }),
      db.query.subChapter.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        with: {
          chapter: {
            columns: { id: true, code: true, name: true },
            with: {
              grade: { columns: { id: true, code: true, name: true } },
              subject: { columns: { id: true, code: true, name: true } },
            },
          },
        },
      }),
    ]);

    const [gradeCounts, subjectCounts, chapterCounts, subChapterCounts] =
      await Promise.all([
        getGradeCountMap(grades.map((row) => row.id)),
        getSubjectCountMap(subjects.map((row) => row.id)),
        getChapterCountMap(chapters.map((row) => row.id)),
        getSubChapterCountMap(subChapters.map((row) => row.id)),
      ]);

    return [
      attachCount(grades, gradeCounts, {
        gradeSubjects: 0,
        chapters: 0,
        questions: 0,
      }),
      attachCount(subjects, subjectCounts, {
        gradeSubjects: 0,
        chapters: 0,
        questions: 0,
      }),
      attachCount(chapters, chapterCounts, { subChapters: 0, questions: 0 }),
      attachCount(subChapters, subChapterCounts, { questions: 0 }),
    ] as const;
  },

  getGradesPage: async (params: PaginationParams) => {
    const { page, pageSize, skip } = normalizePagination(params);
    const [rows, total] = await Promise.all([
      db.query.grade.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        limit: pageSize,
        offset: skip,
      }),
      selectTotal(grade),
    ]);
    const counts = await getGradeCountMap(rows.map((row) => row.id));
    return {
      rows: attachCount(rows, counts, {
        gradeSubjects: 0,
        chapters: 0,
        questions: 0,
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  getSubjectsPage: async (params: PaginationParams) => {
    const { page, pageSize, skip } = normalizePagination(params);
    const [rows, total] = await Promise.all([
      db.query.subject.findMany({
        orderBy: (table, { asc }) => [asc(table.name)],
        limit: pageSize,
        offset: skip,
        with: {
          gradeSubjects: {
            orderBy: (table, { asc }) => [asc(table.sortOrder)],
            with: {
              grade: { columns: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      selectTotal(subject),
    ]);
    const counts = await getSubjectCountMap(rows.map((row) => row.id));
    return {
      rows: attachCount(rows, counts, {
        gradeSubjects: 0,
        chapters: 0,
        questions: 0,
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  getChaptersPage: async (params: PaginationParams) => {
    const { page, pageSize, skip } = normalizePagination(params);
    const [rows, total] = await Promise.all([
      db.query.chapter.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        limit: pageSize,
        offset: skip,
        with: {
          grade: { columns: { id: true, code: true, name: true } },
          subject: { columns: { id: true, code: true, name: true } },
        },
      }),
      selectTotal(chapter),
    ]);
    const counts = await getChapterCountMap(rows.map((row) => row.id));
    return {
      rows: attachCount(rows, counts, { subChapters: 0, questions: 0 }),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  getSubChaptersPage: async (params: PaginationParams) => {
    const { page, pageSize, skip } = normalizePagination(params);
    const [rows, total] = await Promise.all([
      db.query.subChapter.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        limit: pageSize,
        offset: skip,
        with: {
          chapter: {
            columns: { id: true, code: true, name: true },
            with: {
              grade: { columns: { id: true, code: true, name: true } },
              subject: { columns: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      selectTotal(subChapter),
    ]);
    const counts = await getSubChapterCountMap(rows.map((row) => row.id));
    return {
      rows: attachCount(rows, counts, { questions: 0 }),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  createGrade: async (data: CreateGradeInput) => {
    const [created] = await db.insert(grade).values(data).returning();
    return created;
  },

  updateGrade: async (id: string, data: UpdateGradeInput) => {
    const [updated] = await db
      .update(grade)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(grade.id, id))
      .returning();
    if (!updated) throw new Error("Grade not found.");
    return updated;
  },

  deleteGrade: async (id: string) => {
    const [deleted] = await db.delete(grade).where(eq(grade.id, id)).returning();
    if (!deleted) throw new Error("Grade not found.");
    return deleted;
  },

  createSubject: async (data: CreateSubjectInput) => {
    const [created] = await db
      .insert(subject)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      })
      .returning();
    await createSubjectGradeLinks({
      subjectId: created.id,
      gradeIds: data.gradeIds,
    });
    return created;
  },

  updateSubject: async (id: string, data: UpdateSubjectInput) => {
    const [updated] = await db
      .update(subject)
      .set({
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(subject.id, id))
      .returning();
    if (!updated) throw new Error("Subject not found.");
    if (Array.isArray(data.gradeIds)) {
      await replaceSubjectGradeLinks({ subjectId: id, gradeIds: data.gradeIds });
    }
    return updated;
  },

  deleteSubject: async (id: string) => {
    const [deleted] = await db
      .delete(subject)
      .where(eq(subject.id, id))
      .returning();
    if (!deleted) throw new Error("Subject not found.");
    return deleted;
  },

  createChapter: async (data: CreateChapterInput) => {
    const [created] = await db.insert(chapter).values(data).returning();
    return created;
  },

  updateChapter: async (id: string, data: UpdateChapterInput) => {
    const [updated] = await db
      .update(chapter)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chapter.id, id))
      .returning();
    if (!updated) throw new Error("Chapter not found.");
    return updated;
  },

  deleteChapter: async (id: string) => {
    const [deleted] = await db
      .delete(chapter)
      .where(eq(chapter.id, id))
      .returning();
    if (!deleted) throw new Error("Chapter not found.");
    return deleted;
  },

  createSubChapter: async (data: CreateSubChapterInput) => {
    const [created] = await db.insert(subChapter).values(data).returning();
    return created;
  },

  updateSubChapter: async (id: string, data: UpdateSubChapterInput) => {
    const [updated] = await db
      .update(subChapter)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subChapter.id, id))
      .returning();
    if (!updated) throw new Error("Sub chapter not found.");
    return updated;
  },

  deleteSubChapter: async (id: string) => {
    const [deleted] = await db
      .delete(subChapter)
      .where(eq(subChapter.id, id))
      .returning();
    if (!deleted) throw new Error("Sub chapter not found.");
    return deleted;
  },
};
