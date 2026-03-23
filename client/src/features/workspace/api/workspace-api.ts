import { requestServerJson, toServerUrl } from "@/lib/server-http";
import type {
  BrandAsset,
  PracticeSessionDetail,
  PracticeSessionSummary,
  QuestionPaperDetail,
  QuestionPaperSummary,
  SubscriptionRequestRecord,
  WorkspaceCatalogPage,
  WorkspaceCatalogQuestion,
  WorkspaceFilters,
  WorkspaceMeta,
  WorkspaceSummary,
} from "../types";

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const postJson = async <T>(path: string, payload: unknown) =>
  requestServerJson<T>(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const workspaceApi = {
  async getSummary() {
    return requestServerJson<WorkspaceSummary>("/api/v1/workspace/summary");
  },
  async listSubscriptionRequests() {
    return requestServerJson<{ rows: SubscriptionRequestRecord[] }>(
      "/api/v1/subscriptions/my/requests",
    );
  },
  async createSubscriptionRequest(payload: {
    planCode: "pro" | "premium";
    transactionId: string;
    paymentProofImageDataUrl?: string;
    note?: string;
  }) {
    return postJson<SubscriptionRequestRecord>("/api/v1/subscriptions/my/requests", payload);
  },
  async cancelSubscriptionRequest(requestId: string) {
    return postJson<SubscriptionRequestRecord>(
      `/api/v1/subscriptions/my/requests/${requestId}/cancel`,
      {},
    );
  },
  async listBrandAssets() {
    return requestServerJson<{ rows: BrandAsset[] }>("/api/v1/workspace/branding");
  },
  async createBrandAsset(payload: { label: string; imageDataUrl: string }) {
    return postJson<BrandAsset>("/api/v1/workspace/branding", payload);
  },
  async setPrimaryBrandAsset(brandAssetId: string) {
    return postJson<{ rows: BrandAsset[] }>("/api/v1/workspace/branding/primary", { brandAssetId });
  },
  async deleteBrandAsset(brandAssetId: string) {
    return requestServerJson<{ rows: BrandAsset[] }>(`/api/v1/workspace/branding/${brandAssetId}`, {
      method: "DELETE",
    });
  },
  async getMeta() {
    return requestServerJson<WorkspaceMeta>("/api/v1/workspace/meta");
  },
  async getCatalog(
    params: WorkspaceFilters & {
      questionType?: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
      page?: number;
      pageSize?: number;
    },
  ) {
    return requestServerJson<WorkspaceCatalogPage>(
      `/api/v1/workspace/catalog${buildQueryString(params)}`,
    );
  },
  async listPracticeSessions() {
    return requestServerJson<{ rows: PracticeSessionSummary[] }>(
      "/api/v1/workspace/practice/sessions",
    );
  },
  async createPracticeSession(payload: {
    title?: string;
    search?: string;
    gradeId?: string;
    subjectId?: string;
    chapterId?: string;
    subChapterId?: string;
    questionType?: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
    generatorMode?: "all_questions" | "mcq_only";
    questionIds?: string[];
    count?: number;
  }) {
    return postJson<{ id: string; title?: string | null; totalQuestions: number }>(
      "/api/v1/workspace/practice/sessions",
      payload,
    );
  },
  async getPracticeSession(id: string) {
    return requestServerJson<PracticeSessionDetail>(
      `/api/v1/workspace/practice/sessions/${id}`,
    );
  },
  async submitPracticeSession(
    id: string,
    payload: { answers: Array<{ itemId: string; answer?: string }> },
  ) {
    return postJson<PracticeSessionDetail>(
      `/api/v1/workspace/practice/sessions/${id}/submit`,
      payload,
    );
  },
  async listQuestionPapers() {
    return requestServerJson<{ rows: QuestionPaperSummary[] }>(
      "/api/v1/workspace/papers",
    );
  },
  async createQuestionPaper(payload: {
    title: string;
    instructions?: string;
    schoolName?: string;
    academicYear?: string;
    brandAssetId?: string;
    includeAnswerKey?: boolean;
    search?: string;
    gradeId?: string;
    subjectId?: string;
    chapterId?: string;
    subChapterId?: string;
    questionType?: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
    generatorMode?: "all_questions" | "mcq_only";
    questionIds?: string[];
    count?: number;
  }) {
    return postJson<{ id: string; title: string }>(
      "/api/v1/workspace/papers",
      payload,
    );
  },
  async getQuestionPaper(id: string) {
    return requestServerJson<QuestionPaperDetail>(`/api/v1/workspace/papers/${id}`);
  },
  async updateQuestionPaper(
    id: string,
    payload: {
      title: string;
      instructions?: string;
      schoolName?: string;
      academicYear?: string;
      brandAssetId?: string | null;
      includeAnswerKey?: boolean;
    },
  ) {
    return requestServerJson<QuestionPaperDetail>(`/api/v1/workspace/papers/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
  async reorderQuestionPaperItems(id: string, itemIds: string[]) {
    return postJson<QuestionPaperDetail>(`/api/v1/workspace/papers/${id}/reorder`, {
      itemIds,
    });
  },
  async swapQuestionPaperItem(
    id: string,
    itemId: string,
    payload: { candidateQuestionId?: string } = {},
  ) {
    return postJson<QuestionPaperDetail>(
      `/api/v1/workspace/papers/${id}/items/${itemId}/swap`,
      payload,
    );
  },
  async listQuestionPaperSwapCandidates(id: string, itemId: string) {
    return requestServerJson<{ rows: WorkspaceCatalogQuestion[] }>(
      `/api/v1/workspace/papers/${id}/items/${itemId}/candidates`,
    );
  },
  async removeQuestionPaperItem(id: string, itemId: string) {
    return requestServerJson<QuestionPaperDetail>(
      `/api/v1/workspace/papers/${id}/items/${itemId}`,
      {
        method: "DELETE",
      },
    );
  },
  async markQuestionPaperExported(id: string) {
    return postJson<{ id: string; status: "draft" | "finalized"; exportedAt?: string | null }>(
      `/api/v1/workspace/papers/${id}/export`,
      {},
    );
  },
  async updateQuestionPaperStatus(id: string, status: "draft" | "finalized") {
    return postJson<QuestionPaperDetail>(`/api/v1/workspace/papers/${id}/status`, {
      status,
    });
  },
  async downloadQuestionPaperPdf(id: string) {
    const response = await fetch(toServerUrl(`/api/v1/workspace/papers/${id}/pdf`), {
      credentials: "include",
      headers: {
        accept: "application/pdf",
      },
    });

    if (!response.ok) {
      try {
        const payload = (await response.json()) as { message?: string };
        return {
          ok: false as const,
          message: payload.message || "Failed to generate PDF.",
        };
      } catch {
        return {
          ok: false as const,
          message: "Failed to generate PDF.",
        };
      }
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/pdf")) {
      return {
        ok: false as const,
        message: "The server did not return a PDF file.",
      };
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const fileNameMatch = disposition.match(/filename="([^"]+)"/i);

    return {
      ok: true as const,
      data: {
        blob,
        fileName: fileNameMatch?.[1] || `question-paper-${id}.pdf`,
        exportedAt: response.headers.get("x-exported-at"),
      },
    };
  },
  async listExports() {
    return requestServerJson<{ rows: QuestionPaperSummary[] }>(
      "/api/v1/workspace/exports",
    );
  },
  async deleteQuestionPaper(id: string) {
    return requestServerJson<{ id: string; title: string }>(`/api/v1/workspace/papers/${id}`, {
      method: "DELETE",
    });
  },
};
