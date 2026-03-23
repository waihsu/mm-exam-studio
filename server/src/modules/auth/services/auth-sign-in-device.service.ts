import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { authDb, deviceRegistration, session, user } from "@/db";
import {
  resolveDeviceBucket,
  selectAllowedSessionIds,
} from "@/middlewares/session-device-policy";
import {
  ensureCurrentSubscription,
  getUserDeviceLimit,
} from "@/modules/subscriptions/subscription.core";

export type SignInTargetUser = {
  id: string;
  role: string;
};

export type SignInDeviceContextInput = {
  deviceId?: string;
  deviceLabel?: string;
  devicePlatform?: "android" | "ios" | "web" | "unknown";
  deviceModel?: string;
  appVersion?: string;
  osVersion?: string;
};

export type ResolvedSignInDeviceContext = {
  deviceKey: string;
  deviceType: "mobile" | "desktop" | "unknown";
  deviceLabel: string | null;
  devicePlatform: "android" | "ios" | "web" | "unknown" | null;
  deviceModel: string | null;
  appVersion: string | null;
  osVersion: string | null;
};

const DEVICE_ID_PATTERN = /^[A-Za-z0-9._-]{8,200}$/;

const normalizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const normalizeDeviceId = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return DEVICE_ID_PATTERN.test(trimmed) ? trimmed : null;
};

const normalizeUserAgent = (value: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, 180);
};

const resolveDeviceType = (
  request: Request,
  platform: "android" | "ios" | "web" | "unknown" | null,
): "mobile" | "desktop" | "unknown" => {
  if (platform === "android" || platform === "ios") {
    return "mobile";
  }

  const bucket = resolveDeviceBucket(request.headers.get("user-agent"));
  if (platform === "web") {
    return bucket;
  }

  const hasUserAgent = Boolean(normalizeUserAgent(request.headers.get("user-agent")));
  return hasUserAgent ? bucket : "unknown";
};

const resolveSignInDeviceContext = (
  request: Request,
  input?: SignInDeviceContextInput | null,
): ResolvedSignInDeviceContext => {
  const platform = input?.devicePlatform ?? null;
  const normalizedUserAgent = normalizeUserAgent(request.headers.get("user-agent"));
  const fallbackBucket = resolveDeviceBucket(normalizedUserAgent);
  const normalizedDeviceId = normalizeDeviceId(input?.deviceId);
  const fallbackKey = `ua:${fallbackBucket}:${normalizedUserAgent ?? "unknown"}`;

  return {
    deviceKey: normalizedDeviceId ? `client:${normalizedDeviceId}` : fallbackKey,
    deviceType: resolveDeviceType(request, platform),
    deviceLabel: normalizeText(input?.deviceLabel, 120),
    devicePlatform: platform,
    deviceModel: normalizeText(input?.deviceModel, 120),
    appVersion: normalizeText(input?.appVersion, 40),
    osVersion: normalizeText(input?.osVersion, 40),
  };
};

export const findUserByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const [row] = await authDb
    .select({
      id: user.id,
      role: user.role,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1);

  return row ?? null;
};

const canSignInFromSessionPolicyFallback = async (
  targetUserId: string,
  request: Request,
  deviceLimit: number,
) => {
  const sessions = await authDb
    .select({
      id: session.id,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
    })
    .from(session)
    .where(and(eq(session.userId, targetUserId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.createdAt));

  if (!sessions.length) {
    return true;
  }

  const allowed = selectAllowedSessionIds(
    [
      ...sessions.map((entry) => ({
        id: entry.id,
        userAgent: entry.userAgent,
        createdAtMs: entry.createdAt.getTime(),
      })),
      {
        id: "__incoming__",
        userAgent: request.headers.get("user-agent"),
        createdAtMs: Date.now(),
      },
    ],
    deviceLimit,
  );

  return allowed.has("__incoming__");
};

export const canSignInFromDevice = async (
  email: string,
  request: Request,
  resolvedUser?: SignInTargetUser | null,
  deviceContextInput?: SignInDeviceContextInput | null,
) => {
  const targetUser = resolvedUser ?? (await findUserByEmail(email));
  const resolvedDevice = resolveSignInDeviceContext(request, deviceContextInput);

  if (!targetUser) {
    return {
      allowed: true,
      deviceLimit: 1,
      device: resolvedDevice,
    };
  }

  const deviceLimit = await getUserDeviceLimit(targetUser.id);

  const activeRegistrations = await authDb
    .select({
      deviceKey: deviceRegistration.deviceKey,
    })
    .from(deviceRegistration)
    .where(
      and(
        eq(deviceRegistration.userId, targetUser.id),
        isNull(deviceRegistration.revokedAt),
      ),
    )
    .orderBy(asc(deviceRegistration.firstSeenAt));

  if (activeRegistrations.length > 0) {
    const hasCurrentDevice = activeRegistrations.some(
      (entry) => entry.deviceKey === resolvedDevice.deviceKey,
    );

    return {
      allowed: hasCurrentDevice || activeRegistrations.length < deviceLimit,
      deviceLimit,
      device: resolvedDevice,
    };
  }

  const allowed = await canSignInFromSessionPolicyFallback(
    targetUser.id,
    request,
    deviceLimit,
  );

  return {
    allowed,
    deviceLimit,
    device: resolvedDevice,
  };
};

export const touchSignInDeviceRegistration = async (params: {
  userId: string;
  request: Request;
  deviceContextInput?: SignInDeviceContextInput | null;
}) => {
  const resolvedDevice = resolveSignInDeviceContext(
    params.request,
    params.deviceContextInput,
  );
  const now = new Date();
  const currentSubscription = await ensureCurrentSubscription(params.userId);

  await authDb
    .insert(deviceRegistration)
    .values({
      subscriptionId: currentSubscription.id,
      userId: params.userId,
      deviceKey: resolvedDevice.deviceKey,
      deviceType: resolvedDevice.deviceType,
      deviceLabel: resolvedDevice.deviceLabel,
      userAgent: params.request.headers.get("user-agent"),
      firstSeenAt: now,
      lastSeenAt: now,
      revokedAt: null,
    })
    .onConflictDoUpdate({
      target: [deviceRegistration.userId, deviceRegistration.deviceKey],
      set: {
        subscriptionId: currentSubscription.id,
        deviceType: resolvedDevice.deviceType,
        deviceLabel: resolvedDevice.deviceLabel,
        userAgent: params.request.headers.get("user-agent"),
        lastSeenAt: now,
        revokedAt: null,
        updatedAt: now,
      },
    });

  return resolvedDevice;
};

