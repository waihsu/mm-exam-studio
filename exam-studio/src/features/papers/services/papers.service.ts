import { API_BASE_URL } from "@/lib/config";
import { apiRequest } from "@/lib/api-client";
import type {
  CreateQuestionPaperInput,
  CreateQuestionPaperResponse,
  ExportedQuestionPaperListResponse,
  QuestionPaperDetail,
  QuestionPaperListResponse,
  QuestionPaperSwapCandidatesResponse,
  ReorderQuestionPaperItemsInput,
  SwapQuestionPaperItemInput,
  UpdateQuestionPaperInput,
} from "../types/papers.types";

export const listQuestionPapers = () =>
  apiRequest<QuestionPaperListResponse>("/api/v1/workspace/papers");

export const createQuestionPaper = (payload: CreateQuestionPaperInput) =>
  apiRequest<CreateQuestionPaperResponse>("/api/v1/workspace/papers", {
    method: "POST",
    body: payload,
  });

export const getQuestionPaperDetail = (paperId: string) =>
  apiRequest<QuestionPaperDetail>(`/api/v1/workspace/papers/${paperId}`);

export const updateQuestionPaper = (
  paperId: string,
  payload: UpdateQuestionPaperInput,
) =>
  apiRequest<QuestionPaperDetail>(`/api/v1/workspace/papers/${paperId}`, {
    method: "PATCH",
    body: payload,
  });

export const updateQuestionPaperStatus = (
  paperId: string,
  status: "draft" | "finalized",
) =>
  apiRequest<QuestionPaperDetail>(`/api/v1/workspace/papers/${paperId}/status`, {
    method: "POST",
    body: { status },
  });

export const markQuestionPaperExported = (paperId: string) =>
  apiRequest<{
    id: string;
    status: "draft" | "finalized";
    exportedAt: string | null;
  }>(`/api/v1/workspace/papers/${paperId}/export`, {
    method: "POST",
    body: {},
  });

export const deleteQuestionPaper = (paperId: string) =>
  apiRequest<{ id: string; title: string }>(`/api/v1/workspace/papers/${paperId}`, {
    method: "DELETE",
  });

export const reorderQuestionPaperItems = (
  paperId: string,
  payload: ReorderQuestionPaperItemsInput,
) =>
  apiRequest<QuestionPaperDetail>(`/api/v1/workspace/papers/${paperId}/reorder`, {
    method: "POST",
    body: payload,
  });

export const getQuestionPaperSwapCandidates = (paperId: string, itemId: string) =>
  apiRequest<QuestionPaperSwapCandidatesResponse>(
    `/api/v1/workspace/papers/${paperId}/items/${itemId}/candidates`,
  );

export const swapQuestionPaperItem = (
  paperId: string,
  itemId: string,
  payload: SwapQuestionPaperItemInput,
) =>
  apiRequest<QuestionPaperDetail>(
    `/api/v1/workspace/papers/${paperId}/items/${itemId}/swap`,
    {
      method: "POST",
      body: payload,
    },
  );

export const removeQuestionPaperItem = (paperId: string, itemId: string) =>
  apiRequest<QuestionPaperDetail>(`/api/v1/workspace/papers/${paperId}/items/${itemId}`, {
    method: "DELETE",
  });

export const listExportedQuestionPapers = () =>
  apiRequest<ExportedQuestionPaperListResponse>("/api/v1/workspace/exports");

export const getQuestionPaperPdfUrl = (paperId: string) =>
  `${API_BASE_URL}/api/v1/workspace/papers/${paperId}/pdf`;
