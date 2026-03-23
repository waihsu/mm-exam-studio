import { api } from "@/lib/api-client";
import type {
  AdminPlanRecord,
  AdminSubscriptionFilters,
  AdminSubscriptionRequest,
  PlanCode,
  AdminSubscriptionRow,
  PaginatedAdminSubscriptionRequestResult,
  PaginatedAdminSubscriptionResult,
  UpdateAdminSubscriptionInput,
} from "../types";

const toQueryString = (
  filters: Record<string, string | number | undefined> = {},
) => {
  const params = new URLSearchParams();

  if (typeof filters.search === "string" && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (typeof filters.planCode === "string") params.set("planCode", filters.planCode);
  if (typeof filters.status === "string") params.set("status", filters.status);
  if (typeof filters.page === "number") params.set("page", String(filters.page));
  if (typeof filters.pageSize === "number") {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const subscriptionApi = {
  getPlans: () => api.get<AdminPlanRecord[]>("/subscriptions/plans"),
  getRequests: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    planCode?: PlanCode;
    status?: "pending" | "approved" | "rejected" | "canceled";
  } = {}) =>
    api.get<PaginatedAdminSubscriptionRequestResult>(
      `/subscriptions/admin/requests${toQueryString(params)}`,
    ),
  getRequestDetail: (requestId: string) =>
    api.get<AdminSubscriptionRequest>(`/subscriptions/admin/requests/${requestId}`),
  getAdminUsers: (filters: AdminSubscriptionFilters = {}) =>
    api.get<PaginatedAdminSubscriptionResult>(
      `/subscriptions/admin/users${toQueryString(filters)}`,
    ),
  reviewRequest: (
    requestId: string,
    data: { decision: "approved" | "rejected"; adminNote?: string },
  ) =>
    api.post<{
      request: AdminSubscriptionRequest;
      updatedPlanCode?: "free" | "pro" | "premium" | null;
    }>(`/subscriptions/admin/requests/${requestId}/review`, data),
  updateUserSubscription: (userId: string, data: UpdateAdminSubscriptionInput) =>
    api.put<AdminSubscriptionRow>(`/subscriptions/admin/users/${userId}`, data),
};
