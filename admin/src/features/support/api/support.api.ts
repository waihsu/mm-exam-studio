import { api } from "@/lib/api-client";
import type {
  AdminSupportConversation,
  AdminSupportConversationDetail,
  PaginatedAdminSupportConversationResult,
} from "../types";

const toQueryString = (
  filters: Record<string, string | number | undefined> = {},
) => {
  const params = new URLSearchParams();

  if (typeof filters.search === "string" && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (typeof filters.status === "string") params.set("status", filters.status);
  if (typeof filters.page === "number") params.set("page", String(filters.page));
  if (typeof filters.pageSize === "number") {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const supportApi = {
  getConversations: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: "open" | "closed";
  } = {}) =>
    api.get<PaginatedAdminSupportConversationResult>(
      `/support/admin/conversations${toQueryString(params)}`,
    ),
  getConversationDetail: (conversationId: string) =>
    api.get<AdminSupportConversationDetail>(
      `/support/admin/conversations/${conversationId}`,
    ),
  replyToConversation: (
    conversationId: string,
    data: { body: string; subject?: string },
  ) =>
    api.post<AdminSupportConversationDetail>(
      `/support/admin/conversations/${conversationId}/messages`,
      data,
    ),
  updateConversationStatus: (
    conversationId: string,
    data: { status?: "open" | "closed"; allowUserReplies?: boolean },
  ) =>
    api.post<AdminSupportConversation>(
      `/support/admin/conversations/${conversationId}/status`,
      data,
    ),
};
