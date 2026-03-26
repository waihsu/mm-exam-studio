import type { AdminUserRole } from "../types";

export const getNextAdminUserRole = (
  role: AdminUserRole,
): "user" | "admin" => (role === "admin" ? "user" : "admin");

export const canManageAdminUserRole = (params: {
  isSuperAdmin: boolean;
  actorUserId: string | null | undefined;
  targetUserId: string;
  targetRole: AdminUserRole;
}) => {
  if (!params.isSuperAdmin) return false;
  if (!params.actorUserId) return false;
  if (params.targetRole === "superadmin") return false;
  return params.actorUserId !== params.targetUserId;
};
