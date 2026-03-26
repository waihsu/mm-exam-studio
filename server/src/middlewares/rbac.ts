import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "../lib/auth";
import type {
  AppBindings,
  AppRole,
  AppSession,
  AppUser,
} from "@/core/types/app";

import { enforceSessionDevicePolicy } from "./session-device-policy";
import {
  getAccountAccessBlock,
  getUserAccountAccessStateById,
  type UserAccountAccessState,
} from "../utils/account-access";
import { authDb, user as authUser } from "@/db";
import { eq } from "drizzle-orm";
import { getUserDeviceLimit } from "@/modules/subscriptions/subscription.core";

/* =========================================================
   TYPES
========================================================= */

type SessionPayload = {
  user: AppUser;
  session: AppSession;
};

type AuthenticatedAppUser = AppUser & {
  emailVerified?: boolean | null;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeEmail = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getEnvEmails = (...keys: Array<string | null | undefined>) =>
  keys
    .filter((item): item is string => Boolean(item))
    .flatMap((item) => item.split(","))
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

const getEnvAdminEmails = () =>
  getEnvEmails(process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS);

const getEnvSuperAdminEmails = () =>
  getEnvEmails(process.env.SUPERADMIN_EMAIL, process.env.SUPERADMIN_EMAILS);

const isBannedUser = (user: AppUser | null) => {
  if (!user) return false;
  return user.banned === true;
};

const readPositiveMs = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const authStateCacheTtlMs = readPositiveMs(process.env.AUTH_CONTEXT_CACHE_MS, 15_000);
const devicePolicyCheckIntervalMs = readPositiveMs(
  process.env.AUTH_DEVICE_POLICY_CHECK_INTERVAL_MS,
  30_000,
);
const maxCachedUsers = readPositiveMs(process.env.AUTH_CONTEXT_CACHE_MAX_USERS, 1_000);
const maxCachedSessions = readPositiveMs(
  process.env.AUTH_DEVICE_POLICY_CACHE_MAX_SESSIONS,
  2_000,
);

type CachedUserAccess = {
  state: UserAccountAccessState;
  roles: AppRole[];
  deviceLimit: number;
  expiresAt: number;
};

const cachedUserAccessByUserId = new Map<string, CachedUserAccess>();
const devicePolicyCheckedAtBySessionId = new Map<string, number>();

const trimMapToMaxEntries = (map: Map<string, unknown>, maxEntries: number) => {
  if (map.size <= maxEntries) return;

  const overflow = map.size - maxEntries;
  let removed = 0;
  for (const key of map.keys()) {
    map.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
};

/* =========================================================
   SESSION LOADER
========================================================= */

const loadSessionPayload = async (
  request: Request,
): Promise<SessionPayload> => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || !session.session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const appUser = session.user as AuthenticatedAppUser;

  if (isBannedUser(appUser)) {
    throw new HTTPException(403, { message: "Account is banned" });
  }

  return {
    user: appUser,
    session: session.session as AppSession,
  };
};

/* =========================================================
   ROLE RESOLUTION (SIMPLE VERSION)
========================================================= */

export const resolveUserRoles = async (user: AppUser): Promise<AppRole[]> => {
  const [dbUser] = await authDb
    .select({ role: authUser.role })
    .from(authUser)
    .where(eq(authUser.id, user.id))
    .limit(1);

  const isVerifiedEmail = (user as AuthenticatedAppUser).emailVerified === true;
  const normalizedUserEmail = normalizeEmail(user.email);
  const isEnvAdmin = getEnvAdminEmails().includes(normalizedUserEmail);
  const isEnvSuperAdmin = getEnvSuperAdminEmails().includes(normalizedUserEmail);
  const roles = new Set<AppRole>(["student"]);
  const dbRole = dbUser?.role;

  if (dbRole === "superadmin" || (isEnvSuperAdmin && isVerifiedEmail)) {
    roles.add("admin");
    roles.add("superadmin");
  } else if (dbRole === "admin" || (isEnvAdmin && isVerifiedEmail)) {
    roles.add("admin");
  }

  return Array.from(roles);
};

/* =========================================================
   MAIN CONTEXT BUILDER
========================================================= */

export const ensureAuthContext = async (
  c: Context<AppBindings>,
): Promise<{ user: AppUser; session: AppSession; roles: AppRole[] }> => {
  const existingUser = c.get("user");
  const existingSession = c.get("session");
  const existingRoles = c.get("userRoles");

  // cache (important performance optimization)
  if (existingUser && existingSession && Array.isArray(existingRoles)) {
    return {
      user: existingUser,
      session: existingSession,
      roles: existingRoles,
    };
  }

  const payload = await loadSessionPayload(c.req.raw);
  const now = Date.now();
  const userId = payload.user.id;
  const sessionId =
    typeof payload.session.id === "string" && payload.session.id.trim().length > 0
      ? payload.session.id
      : null;

  const cachedUserAccess = cachedUserAccessByUserId.get(userId);
  const resolvedAccess =
    cachedUserAccess && cachedUserAccess.expiresAt > now
      ? cachedUserAccess
      : null;
  const access = resolvedAccess;

  let state: UserAccountAccessState;
  let roles: AppRole[];
  let deviceLimit: number;

  if (access) {
    state = access.state;
    roles = access.roles;
    deviceLimit = access.deviceLimit;
  } else {
    const [nextState, nextRoles, nextDeviceLimit] = await Promise.all([
      getUserAccountAccessStateById(userId),
      resolveUserRoles(payload.user),
      getUserDeviceLimit(userId),
    ]);

    state = nextState;
    roles = nextRoles;
    deviceLimit = nextDeviceLimit;

    cachedUserAccessByUserId.set(userId, {
      state,
      roles,
      deviceLimit,
      expiresAt: now + authStateCacheTtlMs,
    });
    trimMapToMaxEntries(cachedUserAccessByUserId, maxCachedUsers);
  }

  const blocked = getAccountAccessBlock(state);
  if (blocked) {
    throw new HTTPException(403, { message: blocked.message });
  }

  if (
    sessionId &&
    (devicePolicyCheckedAtBySessionId.get(sessionId) ?? 0) + devicePolicyCheckIntervalMs <=
      now
  ) {
    await enforceSessionDevicePolicy({
      headers: c.req.raw.headers,
      session: payload.session,
      deviceLimit,
    });
    devicePolicyCheckedAtBySessionId.set(sessionId, now);
    trimMapToMaxEntries(devicePolicyCheckedAtBySessionId, maxCachedSessions);
  }

  const enrichedUser: AppUser = {
    ...payload.user,
    accountStatus: state.accountStatus,
    accountStatusReason: state.accountStatusReason,
    accountStatusChangedAt: state.accountStatusChangedAt?.toISOString() ?? null,
    passwordResetRequiredAt: state.passwordResetRequiredAt?.toISOString() ?? null,
  };

  c.set("user", enrichedUser);
  c.set("session", payload.session);
  c.set("userRoles", roles);

  return {
    user: enrichedUser,
    session: payload.session,
    roles,
  };
};

/* =========================================================
   MIDDLEWARES
========================================================= */

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  await ensureAuthContext(c);
  await next();
};

export const requireRoles =
  (...allowedRoles: AppRole[]): MiddlewareHandler<AppBindings> =>
  async (c, next) => {
    const { roles } = await ensureAuthContext(c);

    const isAllowed = roles.some((role) => allowedRoles.includes(role));

    if (!isAllowed) {
      throw new HTTPException(403, {
        message: `Requires one of roles: ${allowedRoles.join(", ")}`,
      });
    }

    await next();
  };
