import { api } from "@/lib/api-client";
import type {
  QuestionPreviewRequestInput,
  QuestionSubmitInput,
} from "../schema/question.schema";
import type {
  QuestionImportResult,
  PaginatedQuestionResult,
  QuestionFilters,
  QuestionMeta,
  QuestionPreview,
  QuestionRecord,
} from "../types/question.type";

const toQuestionQueryString = (filters: QuestionFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.gradeId) params.set("gradeId", filters.gradeId);
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.chapterId) params.set("chapterId", filters.chapterId);
  if (filters.subChapterId) params.set("subChapterId", filters.subChapterId);
  if (filters.type) params.set("type", filters.type);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (typeof filters.isPublished === "boolean") {
    params.set("isPublished", String(filters.isPublished));
  }
  if (typeof filters.page === "number") params.set("page", String(filters.page));
  if (typeof filters.pageSize === "number") {
    params.set("pageSize", String(filters.pageSize));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const questionApi = {
  getMeta: () => api.get<QuestionMeta>("/questions/meta"),
  getQuestions: (filters: QuestionFilters = {}) =>
    api.get<PaginatedQuestionResult>(`/questions${toQuestionQueryString(filters)}`),
  getQuestion: (questionId: string) =>
    api.get<QuestionRecord>(`/questions/${questionId}`),
  createQuestion: (data: QuestionSubmitInput) =>
    api.post<QuestionRecord>("/questions", data),
  updateQuestion: (questionId: string, data: Partial<QuestionSubmitInput>) =>
    api.put<QuestionRecord>(`/questions/${questionId}`, data),
  previewQuestion: (data: QuestionPreviewRequestInput) =>
    api.post<QuestionPreview>("/questions/preview", data),
  duplicateQuestion: (questionId: string) =>
    api.post<QuestionRecord>(`/questions/${questionId}/duplicate`, {}),
  importQuestions: (items: QuestionSubmitInput[]) =>
    api.post<QuestionImportResult>("/questions/import", { items }),
  deleteQuestion: (questionId: string) =>
    api.delete<{ success: true }>(`/questions/${questionId}`),
};
