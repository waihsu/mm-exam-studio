import { and, count as dbCount, desc, eq, ilike, or } from "drizzle-orm";

import { db, question as questionTable } from "@/db";

export type FindQuestionFilters = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  type?:
    | "mcq"
    | "true_false"
    | "short_answer"
    | "long_answer"
    | "fill_blank"
    | "matching";
  mode?: "static" | "variable";
  difficulty?: "easy" | "medium" | "hard";
  isPublished?: boolean;
};

type FindQuestionPageParams = FindQuestionFilters & {
  page: number;
  pageSize: number;
};

const buildQuestionConditions = (filters: FindQuestionFilters = {}) =>
  [
    filters.search
      ? or(
          ilike(questionTable.body, `%${filters.search}%`),
          ilike(questionTable.questionCode, `%${filters.search}%`),
        )
      : undefined,
    filters.gradeId ? eq(questionTable.gradeId, filters.gradeId) : undefined,
    filters.subjectId ? eq(questionTable.subjectId, filters.subjectId) : undefined,
    filters.chapterId ? eq(questionTable.chapterId, filters.chapterId) : undefined,
    filters.subChapterId ? eq(questionTable.subChapterId, filters.subChapterId) : undefined,
    filters.type ? eq(questionTable.type, filters.type) : undefined,
    filters.mode ? eq(questionTable.mode, filters.mode) : undefined,
    filters.difficulty ? eq(questionTable.difficulty, filters.difficulty) : undefined,
    typeof filters.isPublished === "boolean"
      ? eq(questionTable.isPublished, filters.isPublished)
      : undefined,
  ].filter(Boolean);

const buildQuestionWith = () => ({
  options: {
    orderBy: (table: any, { asc }: any) => [asc(table.sortOrder)],
  },
  grade: {
    columns: { id: true, name: true, code: true },
  },
  subject: {
    columns: { id: true, name: true, code: true },
  },
  chapter: {
    columns: { id: true, name: true, code: true },
  },
  subChapter: {
    columns: { id: true, name: true, code: true },
  },
  creator: {
    columns: { id: true, name: true, email: true },
  },
  reviewer: {
    columns: { id: true, name: true, email: true },
  },
});

export const questionRepo = {
  findPage: async ({ page, pageSize, ...filters }: FindQuestionPageParams) => {
    const conditions = buildQuestionConditions(filters);
    const summaryConditions = buildQuestionConditions({
      ...filters,
      isPublished: undefined,
      mode: undefined,
    });

    const [rows, total, published, draft, variable] = await Promise.all([
      db.query.question.findMany({
        where: and(...conditions),
        with: buildQuestionWith(),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db
        .select({ total: dbCount() })
        .from(questionTable)
        .where(and(...conditions))
        .then((result) => result[0]?.total ?? 0),
      db
        .select({ total: dbCount() })
        .from(questionTable)
        .where(and(...summaryConditions, eq(questionTable.isPublished, true)))
        .then((result) => result[0]?.total ?? 0),
      db
        .select({ total: dbCount() })
        .from(questionTable)
        .where(and(...summaryConditions, eq(questionTable.isPublished, false)))
        .then((result) => result[0]?.total ?? 0),
      db
        .select({ total: dbCount() })
        .from(questionTable)
        .where(and(...summaryConditions, eq(questionTable.mode, "variable")))
        .then((result) => result[0]?.total ?? 0),
    ]);

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary: {
        published,
        draft,
        variable,
      },
    };
  },

  findById: (id: string) =>
    db.query.question.findFirst({
      where: eq(questionTable.id, id),
      with: buildQuestionWith(),
    }),

  delete: async (id: string) => {
    const [deleted] = await db.delete(questionTable).where(eq(questionTable.id, id)).returning();
    return deleted;
  },
};
