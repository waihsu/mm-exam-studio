import { questionRepo, type FindQuestionFilters } from "../question.repo";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const readPositiveMs = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const QUESTION_LIST_CACHE_MS = readPositiveMs(
  process.env.QUESTION_LIST_CACHE_MS,
  5_000,
);
const QUESTION_LIST_CACHE_MAX = readPositiveMs(
  process.env.QUESTION_LIST_CACHE_MAX,
  100,
);

const questionListCache = new Map<
  string,
  CacheEntry<Awaited<ReturnType<typeof questionRepo.findPage>>>
>();

const trimMapToMaxEntries = (map: Map<string, unknown>, maxEntries: number) => {
  if (map.size <= maxEntries) return;

  const overflow = map.size - maxEntries;
  let removed = 0;
  for (const key of map.keys()) {
    map.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
};

export const clearQuestionListCache = () => {
  questionListCache.clear();
};

const getQuestionListCacheKey = (
  filters: FindQuestionFilters & { page: number; pageSize: number },
) =>
  JSON.stringify({
    search: filters.search ?? null,
    gradeId: filters.gradeId ?? null,
    subjectId: filters.subjectId ?? null,
    chapterId: filters.chapterId ?? null,
    subChapterId: filters.subChapterId ?? null,
    type: filters.type ?? null,
    mode: filters.mode ?? null,
    difficulty: filters.difficulty ?? null,
    isPublished:
      typeof filters.isPublished === "boolean" ? filters.isPublished : null,
    page: filters.page,
    pageSize: filters.pageSize,
  });

export const getQuestions = async (
  filters: FindQuestionFilters & {
    page?: number;
    pageSize?: number;
  } = {},
) => {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(10, Math.trunc(filters.pageSize ?? 20)));
  const normalizedFilters = {
    ...filters,
    page,
    pageSize,
  };
  const cacheKey = getQuestionListCacheKey(normalizedFilters);
  const cached = questionListCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const result = await questionRepo.findPage({
    ...normalizedFilters,
  });

  questionListCache.set(cacheKey, {
    value: result,
    expiresAt: now + QUESTION_LIST_CACHE_MS,
  });
  trimMapToMaxEntries(questionListCache, QUESTION_LIST_CACHE_MAX);
  return result;
};

export const getQuestionById = async (id: string) => {
  const question = await questionRepo.findById(id);
  if (!question) throw new Error("Question not found");
  return question;
};
