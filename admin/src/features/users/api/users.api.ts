import { api } from "@/lib/api-client";
import type {
  AdminUserDirectoryFilters,
  AdminUserDeviceListResult,
  PaginatedAdminUserDirectoryResult,
  RevokeAdminUserDeviceResult,
  UpdateAdminUserRoleResult,
} from "../types";

const toQueryString = (
  filters: Record<string, string | number | undefined> = {},
) => {
  const params = new URLSearchParams();

  if (typeof filters.search === "string" && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (typeof filters.role === "string") params.set("role", filters.role);
  if (typeof filters.accountStatus === "string") {
    params.set("accountStatus", filters.accountStatus);
  }
  if (typeof filters.page === "number") params.set("page", String(filters.page));
  if (typeof filters.pageSize === "number") {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const usersApi = {
  getDirectory: (filters: AdminUserDirectoryFilters = {}) =>
    api.get<PaginatedAdminUserDirectoryResult>(
      `/users/admin/directory${toQueryString(filters)}`,
    ),
  getUserDevices: (userId: string) =>
    api.get<AdminUserDeviceListResult>(
      `/users/admin/${encodeURIComponent(userId)}/devices`,
    ),
  revokeUserDevice: (userId: string, deviceId: string) =>
    api.post<RevokeAdminUserDeviceResult>(
      `/users/admin/${encodeURIComponent(userId)}/devices/${encodeURIComponent(deviceId)}/revoke`,
      {},
    ),
  updateUserRole: (userId: string, role: "user" | "admin") =>
    api.patch<UpdateAdminUserRoleResult>(
      `/users/admin/${encodeURIComponent(userId)}/role`,
      { role },
    ),
};
