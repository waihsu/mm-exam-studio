import { apiRequest } from "@/lib/api-client";
import type {
  CatalogQueryParams,
  CreatePracticeSessionInput,
  CreatePracticeSessionResponse,
  PracticeSessionDetail,
  PracticeSessionListResponse,
  SubmitPracticeSessionInput,
  WorkspaceCatalogResponse,
} from "../types/practice.types";

const buildQueryString = (params: CatalogQueryParams) => {
  const searchParams = new URLSearchParams();

  const append = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === null) {
      return;
    }

    const nextValue = String(value).trim();
    if (nextValue.length === 0) {
      return;
    }

    searchParams.set(key, nextValue);
  };

  append("search", params.search);
  append("gradeId", params.gradeId);
  append("subjectId", params.subjectId);
  append("chapterId", params.chapterId);
  append("subChapterId", params.subChapterId);
  append("questionType", params.questionType);
  for (const type of params.excludeQuestionTypes ?? []) {
    append("excludeQuestionType", type);
  }
  append("page", params.page);
  append("pageSize", params.pageSize);

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
};

export const getWorkspaceCatalog = (params: CatalogQueryParams) =>
  apiRequest<WorkspaceCatalogResponse>(`/api/v1/workspace/catalog${buildQueryString(params)}`);

export const listPracticeSessions = () =>
  apiRequest<PracticeSessionListResponse>("/api/v1/workspace/practice/sessions");

export const createPracticeSession = (payload: CreatePracticeSessionInput) =>
  apiRequest<CreatePracticeSessionResponse>("/api/v1/workspace/practice/sessions", {
    method: "POST",
    body: payload,
  });

export const getPracticeSessionDetail = (sessionId: string) =>
  apiRequest<PracticeSessionDetail>(`/api/v1/workspace/practice/sessions/${sessionId}`);

export const submitPracticeSession = (
  sessionId: string,
  payload: SubmitPracticeSessionInput,
) =>
  apiRequest<PracticeSessionDetail>(`/api/v1/workspace/practice/sessions/${sessionId}/submit`, {
    method: "POST",
    body: payload,
  });
