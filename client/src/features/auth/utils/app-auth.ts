import { redirect } from "@tanstack/react-router";
import { authApi } from "../api/auth-api";
import type { AppAuthSnapshot, UserRole } from "../types";

export const EMPTY_APP_AUTH_SNAPSHOT: AppAuthSnapshot = {
  user: null,
  session: null,
  roles: [],
  isStudent: false,
  isInstructor: false,
  isAdmin: false,
  isAuthenticated: false,
};

const hasRole = (roles: UserRole[], role: UserRole) => roles.includes(role);

export function normalizeRedirectPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function loadAppAuthSnapshot(force = false): Promise<AppAuthSnapshot> {
  const me = await authApi.fetchMe(force);

  if (!me.ok || !me.user) {
    return EMPTY_APP_AUTH_SNAPSHOT;
  }

  const roles = me.roles;

  return {
    user: me.user,
    session: me.session,
    roles,
    isStudent: hasRole(roles, "student"),
    isInstructor: hasRole(roles, "instructor"),
    isAdmin: hasRole(roles, "admin") || hasRole(roles, "superadmin"),
    isAuthenticated: true,
  };
}

export async function requireGuestUser() {
  const snapshot = await loadAppAuthSnapshot();
  if (snapshot.user) {
    throw redirect({ to: "/dashboard" });
  }
}

export async function requireAuthenticatedUser(locationHref?: string) {
  const snapshot = await loadAppAuthSnapshot();
  if (!snapshot.user) {
    throw redirect({
      to: "/signin",
      search: locationHref ? { redirect: locationHref } : undefined,
    });
  }

  return snapshot;
}
