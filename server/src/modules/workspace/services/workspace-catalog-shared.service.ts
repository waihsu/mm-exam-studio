import {
  and,
  asc,
  count as dbCount,
  desc,
  eq,
  ilike,
  inArray,
  not,
  or,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import {
  chapter,
  db,
  question as questionTable,
  subChapter,
} from "@/db";

export type CatalogFilters = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  questionType?:
    | "mcq"
    | "true_false"
    | "short_answer"
    | "long_answer"
    | "fill_blank"
    | "matching";
  excludeQuestionTypes?: Array<
    "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching"
  >;
};

export type WorkspaceAccessPolicy = {
  planCode: "free" | "pro" | "premium";
  restrictToFreePreview: boolean;
  maxQuestionsPerPractice: number | null;
  maxQuestionsPerPaper: number | null;
};

type PlanCode = WorkspaceAccessPolicy["planCode"];
export type CatalogLockReasonCode = "free_preview_only";

export type CatalogSecurityPolicy = {
  maxPageSize: number;
  maxPage: number;
  maxReachableRows: number | null;
};

const CATALOG_SECURITY_BY_PLAN: Record<PlanCode, CatalogSecurityPolicy> = {
  free: {
    maxPageSize: 12,
    maxPage: 10,
    maxReachableRows: 120,
  },
  pro: {
    maxPageSize: 40,
    maxPage: 80,
    maxReachableRows: 3200,
  },
  premium: {
    maxPageSize: 80,
    maxPage: 200,
    maxReachableRows: null,
  },
};

export const LOCKED_CATALOG_PREVIEW_LIMIT = 6;

export type PublishedQuestionRecord = {
  id: string;
  questionCode: string;
  title: string | null;
  body: string;
  type:
    | "mcq"
    | "true_false"
    | "short_answer"
    | "long_answer"
    | "fill_blank"
    | "matching";
  difficulty: "easy" | "medium" | "hard";
  mode: "static" | "variable";
  reviewStatus: "draft" | "in_review" | "needs_changes" | "approved";
  reviewNotes: string | null;
  gradeId: string;
  subjectId: string;
  chapterId: string | null;
  subChapterId: string | null;
  explanation: string | null;
  answerText: string | null;
  answerFormula: string | null;
  variablesSchema: unknown;
  isPublished: boolean;
  isActive: boolean;
  marks: number;
  estimatedTimeSec: number | null;
  updatedAt: Date;
  options: Array<{
    label: string | null;
    text: string;
    isCorrect: boolean;
    sortOrder: number;
  }>;
  grade: {
    id: string;
    code: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
  };
  chapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
  subChapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
};

export const loadPublishedQuestionsByIds = async (ids: string[]) => {
  if (ids.length === 0) {
    return [] as PublishedQuestionRecord[];
  }

  const rows = await db.query.question.findMany({
    where: inArray(questionTable.id, ids),
    with: {
      options: {
        columns: {
          label: true,
          text: true,
          isCorrect: true,
          sortOrder: true,
        },
        orderBy: (table, { asc }) => [asc(table.sortOrder)],
      },
      grade: {
        columns: { id: true, code: true, name: true },
      },
      subject: {
        columns: { id: true, code: true, name: true },
      },
      chapter: {
        columns: { id: true, code: true, name: true, isFreePreview: true },
      },
      subChapter: {
        columns: { id: true, code: true, name: true, isFreePreview: true },
      },
    },
  });

  return rows as PublishedQuestionRecord[];
};

const buildPlanQuestionCondition = (access?: WorkspaceAccessPolicy) => {
  if (!access) {
    return undefined;
  }

  if (access.planCode === "free") {
    return or(eq(chapter.isFreePreview, true), eq(subChapter.isFreePreview, true));
  }

  return undefined;
};

export const buildPlanLockedCondition = (access?: WorkspaceAccessPolicy) => {
  if (!access || access.planCode === "premium") {
    return undefined;
  }

  if (access.planCode === "free") {
    return sql<boolean>`coalesce(${chapter.isFreePreview}, false) = false and coalesce(${subChapter.isFreePreview}, false) = false`;
  }

  return undefined;
};

export const lockReasonCodeForPlan = (
  access?: WorkspaceAccessPolicy,
): CatalogLockReasonCode | null => {
  if (!access || access.planCode === "premium") return null;
  if (access.planCode === "free") return "free_preview_only";
  return null;
};

const lockReasonTextForCode = (code: CatalogLockReasonCode) => {
  if (code === "free_preview_only") {
    return "Free plan only supports free-preview chapters and lessons.";
  }
  return "Some questions are unavailable for this plan.";
};

export const unavailableQuestionsMessageForPlan = (access?: WorkspaceAccessPolicy) => {
  if (!access) {
    return "Some selected questions are unavailable or unpublished.";
  }

  if (access.planCode === "free") {
    return "Your free plan can only use questions from free chapters and lessons.";
  }

  return "Some selected questions are unavailable or unpublished.";
};

const buildCatalogConditions = (
  filters: CatalogFilters = {},
  access?: WorkspaceAccessPolicy,
  options: { includePlanCondition?: boolean } = {},
) => {
  const includePlanCondition = options.includePlanCondition ?? true;
  const conditions = [
    eq(questionTable.isPublished, true),
    eq(questionTable.isActive, true),
    filters.gradeId ? eq(questionTable.gradeId, filters.gradeId) : undefined,
    filters.subjectId ? eq(questionTable.subjectId, filters.subjectId) : undefined,
    filters.chapterId ? eq(questionTable.chapterId, filters.chapterId) : undefined,
    filters.subChapterId ? eq(questionTable.subChapterId, filters.subChapterId) : undefined,
    filters.questionType ? eq(questionTable.type, filters.questionType) : undefined,
    filters.excludeQuestionTypes?.length
      ? not(inArray(questionTable.type, filters.excludeQuestionTypes))
      : undefined,
    includePlanCondition ? buildPlanQuestionCondition(access) : undefined,
    filters.search
      ? or(
          ilike(questionTable.body, `%${filters.search}%`),
          ilike(questionTable.questionCode, `%${filters.search}%`),
          ilike(questionTable.title, `%${filters.search}%`),
        )
      : undefined,
  ];

  return conditions.filter(Boolean);
};

const isQuestionFreePreview = (question: Pick<PublishedQuestionRecord, "chapter" | "subChapter">) =>
  Boolean(question.subChapter?.isFreePreview || question.chapter?.isFreePreview);

const excerpt = (value: string, maxLength = 180) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;

export const toCatalogQuestion = (question: PublishedQuestionRecord) => {
  return {
    id: question.id,
    questionCode: question.questionCode,
    title: question.title,
    bodyPreview: excerpt(question.body),
    type: question.type,
    difficulty: question.difficulty,
    mode: question.mode,
    marks: question.marks,
    estimatedTimeSec: question.estimatedTimeSec,
    grade: question.grade,
    subject: question.subject,
    chapter: question.chapter,
    subChapter: question.subChapter,
    isFreePreview: isQuestionFreePreview(question),
  };
};

export const toCatalogLockedQuestion = (
  question: PublishedQuestionRecord,
  lockReasonCode: CatalogLockReasonCode,
) => {
  return {
    id: question.id,
    questionCode: question.questionCode,
    type: question.type,
    difficulty: question.difficulty,
    mode: question.mode,
    marks: question.marks,
    estimatedTimeSec: question.estimatedTimeSec,
    grade: question.grade,
    subject: question.subject,
    chapter: question.chapter,
    subChapter: question.subChapter,
    isFreePreview: isQuestionFreePreview(question),
    lockReasonCode,
    lockReason: lockReasonTextForCode(lockReasonCode),
  };
};

export const resolveCatalogSecurityPolicy = (access: WorkspaceAccessPolicy): CatalogSecurityPolicy =>
  CATALOG_SECURITY_BY_PLAN[access.planCode];

export const assertCatalogWindowAllowed = (params: {
  access: WorkspaceAccessPolicy;
  page: number;
  pageSize: number;
}) => {
  const policy = resolveCatalogSecurityPolicy(params.access);
  if (params.page > policy.maxPage) {
    throw new Error(
      "Catalog rate limit exceeded for your current plan. Narrow filters or try later.",
    );
  }

  const offset = (params.page - 1) * params.pageSize;
  if (typeof policy.maxReachableRows === "number" && offset >= policy.maxReachableRows) {
    throw new Error(
      "Catalog rate limit exceeded for your current plan. Narrow filters or try later.",
    );
  }
};

export const resolveEffectiveCatalogPageSize = (params: {
  access: WorkspaceAccessPolicy;
  requestedPageSize: number;
  page: number;
}) => {
  const policy = resolveCatalogSecurityPolicy(params.access);
  const clamped = Math.max(10, Math.min(policy.maxPageSize, params.requestedPageSize));
  if (typeof policy.maxReachableRows !== "number") {
    return clamped;
  }

  const remaining = policy.maxReachableRows - (params.page - 1) * clamped;
  if (remaining <= 0) {
    return 0;
  }
  return Math.min(clamped, remaining);
};

export const findPublishedQuestionIds = async (params: {
  filters?: CatalogFilters;
  access?: WorkspaceAccessPolicy;
  extraConditions?: Array<SQLWrapper | undefined>;
  excludeIds?: string[];
  order?: "latest" | "stable";
  limit?: number;
  offset?: number;
}) => {
  const conditions = [
    ...buildCatalogConditions(params.filters, params.access),
    ...(params.extraConditions ?? []),
    params.excludeIds?.length ? not(inArray(questionTable.id, params.excludeIds)) : undefined,
  ].filter((condition): condition is SQLWrapper => Boolean(condition));

  const rows = await db
    .select({ id: questionTable.id, updatedAt: questionTable.updatedAt })
    .from(questionTable)
    .leftJoin(chapter, eq(questionTable.chapterId, chapter.id))
    .leftJoin(subChapter, eq(questionTable.subChapterId, subChapter.id))
    .where(and(...conditions))
    .orderBy(
      ...(params.order === "stable"
        ? [asc(questionTable.questionCode)]
        : [desc(questionTable.updatedAt)]),
    )
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);

  return rows.map((row) => row.id);
};

export const countPublishedQuestions = async (
  filters: CatalogFilters = {},
  access?: WorkspaceAccessPolicy,
) => {
  const conditions = buildCatalogConditions(filters, access);
  const rows = await db
    .select({ total: dbCount() })
    .from(questionTable)
    .leftJoin(chapter, eq(questionTable.chapterId, chapter.id))
    .leftJoin(subChapter, eq(questionTable.subChapterId, subChapter.id))
    .where(and(...conditions));

  return rows[0]?.total ?? 0;
};

export const findLockedQuestionIds = async (params: {
  filters?: CatalogFilters;
  lockedCondition: SQLWrapper;
  limit?: number;
}) => {
  const conditions = [
    ...buildCatalogConditions(params.filters, undefined, { includePlanCondition: false }),
    params.lockedCondition,
  ].filter((condition): condition is SQLWrapper => Boolean(condition));

  const rows = await db
    .select({ id: questionTable.id, updatedAt: questionTable.updatedAt })
    .from(questionTable)
    .leftJoin(chapter, eq(questionTable.chapterId, chapter.id))
    .leftJoin(subChapter, eq(questionTable.subChapterId, subChapter.id))
    .where(and(...conditions))
    .orderBy(desc(questionTable.updatedAt))
    .limit(params.limit ?? 6);

  return rows.map((row) => row.id);
};

export const countLockedQuestions = async (params: {
  filters?: CatalogFilters;
  lockedCondition: SQLWrapper;
}) => {
  const conditions = [
    ...buildCatalogConditions(params.filters, undefined, { includePlanCondition: false }),
    params.lockedCondition,
  ].filter((condition): condition is SQLWrapper => Boolean(condition));

  const rows = await db
    .select({ total: dbCount() })
    .from(questionTable)
    .leftJoin(chapter, eq(questionTable.chapterId, chapter.id))
    .leftJoin(subChapter, eq(questionTable.subChapterId, subChapter.id))
    .where(and(...conditions));

  return rows[0]?.total ?? 0;
};
