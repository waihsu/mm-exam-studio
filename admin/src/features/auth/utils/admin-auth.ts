import type { AdminAuthSnapshot } from "../context/admin-auth-context";
import { authApi } from "../api/auth-api";
import type { UserRole } from "../types";

export const EMPTY_ADMIN_AUTH_SNAPSHOT: AdminAuthSnapshot = {
  user: null,
  roles: [],
  isStudent: false,
  isInstructor: false,
  isAdmin: false,
  canAccessAdmin: false,
};

const hasRole = (roles: UserRole[], role: UserRole) => roles.includes(role);

export async function loadAdminAuthSnapshot(): Promise<AdminAuthSnapshot> {
  const me = await authApi.fetchMe();

  if (!me.ok || !me.user) {
    return EMPTY_ADMIN_AUTH_SNAPSHOT;
  }

  const roles = me.roles;
  const isAdmin = hasRole(roles, "admin") || hasRole(roles, "superadmin");

  return {
    user: me.user,
    roles,
    isStudent: hasRole(roles, "student"),
    isInstructor: hasRole(roles, "instructor"),
    isAdmin,
    canAccessAdmin: isAdmin,
  };
}
