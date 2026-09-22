import type { QuestionFilters, QuestionMode } from "./types/question.type";

export type QuestionListSearch = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  type?: "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching";
  mode?: QuestionMode;
  difficulty?: "easy" | "medium" | "hard";
  isPublished?: "true" | "false";
  page?: number;
  pageSize?: number;
};

export const DEFAULT_QUESTION_PAGE = 1;
export const DEFAULT_QUESTION_PAGE_SIZE = 20;
export const QUESTION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const toQuestionFilters = (search: QuestionListSearch): QuestionFilters => ({
  search: search.search,
  gradeId: search.gradeId,
  subjectId: search.subjectId,
  chapterId: search.chapterId,
  subChapterId: search.subChapterId,
  type: search.type,
  mode: search.mode,
  difficulty: search.difficulty,
  isPublished:
    search.isPublished === "true"
      ? true
      : search.isPublished === "false"
        ? false
        : undefined,
  page: search.page ?? DEFAULT_QUESTION_PAGE,
  pageSize: search.pageSize ?? DEFAULT_QUESTION_PAGE_SIZE,
});

export const toQuestionListSearch = (filters: QuestionFilters): QuestionListSearch => ({
  search: filters.search || undefined,
  gradeId: filters.gradeId || undefined,
  subjectId: filters.subjectId || undefined,
  chapterId: filters.chapterId || undefined,
  subChapterId: filters.subChapterId || undefined,
  type: filters.type,
  mode: filters.mode,
  difficulty: filters.difficulty,
  isPublished:
    typeof filters.isPublished === "boolean"
      ? (String(filters.isPublished) as "true" | "false")
      : undefined,
  page:
    filters.page && filters.page > DEFAULT_QUESTION_PAGE ? filters.page : undefined,
  pageSize:
    filters.pageSize && filters.pageSize !== DEFAULT_QUESTION_PAGE_SIZE
      ? filters.pageSize
      : undefined,
});

export const validateQuestionListSearch = (search: Record<string, unknown>): QuestionListSearch => ({
  search: typeof search.search === "string" ? search.search : undefined,
  gradeId: typeof search.gradeId === "string" ? search.gradeId : undefined,
  subjectId: typeof search.subjectId === "string" ? search.subjectId : undefined,
  chapterId: typeof search.chapterId === "string" ? search.chapterId : undefined,
  subChapterId: typeof search.subChapterId === "string" ? search.subChapterId : undefined,
  type:
    search.type === "mcq" ||
    search.type === "true_false" ||
    search.type === "short_answer" ||
    search.type === "long_answer" ||
    search.type === "fill_blank" ||
    search.type === "matching"
      ? search.type
      : undefined,
  mode: search.mode === "static" || search.mode === "variable" ? search.mode : undefined,
  difficulty:
    search.difficulty === "easy" || search.difficulty === "medium" || search.difficulty === "hard"
      ? search.difficulty
      : undefined,
  isPublished:
    search.isPublished === "true" || search.isPublished === "false"
      ? search.isPublished
      : undefined,
  page:
    typeof search.page === "number"
      ? search.page
      : typeof search.page === "string"
        ? Number(search.page) || DEFAULT_QUESTION_PAGE
        : undefined,
  pageSize:
    typeof search.pageSize === "number"
      ? search.pageSize
      : typeof search.pageSize === "string"
        ? Number(search.pageSize) || DEFAULT_QUESTION_PAGE_SIZE
        : undefined,
});
