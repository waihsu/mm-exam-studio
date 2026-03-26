import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth";
import type { AppSession } from "../core/types/app";

type ListedSession = {
  id?: unknown;
  token?: unknown;
  userAgent?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
};

type NormalizedSession = {
  id: string;
  token: string | null;
  userAgent: string | null;
  createdAtMs: number;
  expiresAtMs: number | null;
};

type DeviceBucket = "mobile" | "desktop";

const MOBILE_UA_PATTERN = /iphone|ipod|android.*mobile|mobile|phone|okhttp|cfnetwork|darwin/i;
const TABLET_UA_PATTERN = /ipad|tablet|android(?!.*mobile)/i;

const toOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const toTimestamp = (value: unknown): number => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const toOptionalTimestamp = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeUserAgent = (value: unknown): string | null => {
  const userAgent = toOptionalString(value);
  if (!userAgent) return null;
  return userAgent.toLowerCase().replace(/\s+/g, " ").trim();
};

export const resolveDeviceBucket = (userAgent: string | null): DeviceBucket => {
  if (!userAgent) return "desktop";
  if (TABLET_UA_PATTERN.test(userAgent)) return "mobile";
  if (MOBILE_UA_PATTERN.test(userAgent)) return "mobile";
  return "desktop";
};

type SessionDevice = {
  id: string;
  key: string;
  bucket: DeviceBucket;
};

const toSessionDevice = (
  session: Pick<NormalizedSession, "id" | "userAgent">,
): SessionDevice => {
  const normalizedUserAgent = normalizeUserAgent(session.userAgent);
  const bucket = resolveDeviceBucket(normalizedUserAgent);
  return {
    id: session.id,
    key: `${bucket}:${normalizedUserAgent ?? "unknown"}`,
    bucket,
  };
};

const normalizeSessions = (sessions: unknown[]): NormalizedSession[] => {
  return sessions
    .map((item) => {
      const source = (item ?? {}) as ListedSession;
      const id = toOptionalString(source.id);
      if (!id) return null;
      return {
        id,
        token: toOptionalString(source.token),
        userAgent: toOptionalString(source.userAgent),
        createdAtMs: toTimestamp(source.createdAt),
        expiresAtMs: toOptionalTimestamp(source.expiresAt),
      };
    })
    .filter((item): item is NormalizedSession => item !== null);
};

const listActiveSessions = (sessions: NormalizedSession[], nowMs: number) =>
  sessions
    .filter((item) =>
      item.expiresAtMs === null ? true : item.expiresAtMs > nowMs,
    )
    .sort((a, b) => a.createdAtMs - b.createdAtMs);

export const selectAllowedSessionIds = (
  sessions: Array<{
    id: string;
    userAgent: string | null;
    createdAtMs: number;
  }>,
  deviceLimit: number,
): Set<string> => {
  const sorted = [...sessions]
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
    .map((item) => {
      const normalizedUserAgent = normalizeUserAgent(item.userAgent);
      return {
        ...item,
        key: `${resolveDeviceBucket(normalizedUserAgent)}:${normalizedUserAgent ?? "unknown"}`,
        bucket: resolveDeviceBucket(normalizedUserAgent),
      };
    });
  const allowed = new Set<string>();
  const normalizedDeviceLimit = Math.max(1, Math.trunc(deviceLimit || 1));

  if (normalizedDeviceLimit <= 1) {
    const primaryDeviceKey = sorted[0]?.key;
    if (primaryDeviceKey) {
      for (const item of sorted) {
        if (item.key === primaryDeviceKey) {
          allowed.add(item.id);
        }
      }
    }
    return allowed;
  }

  const allowedDeviceKeys = new Set<string>();
  const firstMobile = sorted.find((item) => item.bucket === "mobile");
  const firstDesktop = sorted.find((item) => item.bucket === "desktop");

  if (firstMobile) allowedDeviceKeys.add(firstMobile.key);
  if (firstDesktop) allowedDeviceKeys.add(firstDesktop.key);

  if (allowedDeviceKeys.size === 0 && sorted[0]) {
    allowedDeviceKeys.add(sorted[0].key);
  }

  if (normalizedDeviceLimit > 2) {
    for (const item of sorted) {
      if (allowedDeviceKeys.size >= normalizedDeviceLimit) break;
      allowedDeviceKeys.add(item.key);
    }
  } else if (allowedDeviceKeys.size < normalizedDeviceLimit) {
    for (const item of sorted) {
      if (allowedDeviceKeys.size >= normalizedDeviceLimit) break;
      allowedDeviceKeys.add(item.key);
    }
  }

  for (const item of sorted) {
    if (allowedDeviceKeys.has(item.key)) {
      allowed.add(item.id);
    }
  }

  return allowed;
};

export const policyMessageFor = (deviceLimit: number) =>
  deviceLimit <= 1
    ? "This account allows only one active device at a time."
    : `This account allows up to ${deviceLimit} active devices.`;

export const enforceSessionDevicePolicy = async (params: {
  headers: Headers;
  session: AppSession;
  deviceLimit: number;
}) => {
  const currentSessionId = toOptionalString(params.session.id);
  if (!currentSessionId) return;

  const list = (await auth.api.listSessions({
    headers: params.headers,
  })) as unknown;
  if (!Array.isArray(list) || list.length <= 1) return;

  const nowMs = Date.now();
  const activeSessions = listActiveSessions(normalizeSessions(list), nowMs);
  if (activeSessions.length <= 1) return;

  const allowedSessionIds = selectAllowedSessionIds(
    activeSessions.map((item) => ({
      id: item.id,
      userAgent: item.userAgent,
      createdAtMs: item.createdAtMs,
    })),
    params.deviceLimit,
  );

  if (allowedSessionIds.has(currentSessionId)) return;

  const currentSession =
    activeSessions.find((item) => item.id === currentSessionId) ?? null;
  const currentDevice = currentSession ? toSessionDevice(currentSession) : null;
  if (!currentSession || !currentDevice) {
    throw new HTTPException(401, {
      message: policyMessageFor(params.deviceLimit),
    });
  }

  const keepSessionIds = new Set<string>();
  for (const sessionItem of activeSessions) {
    const device = toSessionDevice(sessionItem);
    if (device.key === currentDevice.key) {
      keepSessionIds.add(sessionItem.id);
    }
  }

  if (params.deviceLimit >= 2) {
    const oppositeBucket =
      currentDevice.bucket === "mobile" ? "desktop" : "mobile";
    const oppositeCandidate = activeSessions
      .filter((item) => item.id !== currentSession.id)
      .map((item) => ({ item, device: toSessionDevice(item) }))
      .find((entry) => entry.device.bucket === oppositeBucket);

    if (oppositeCandidate) {
      for (const sessionItem of activeSessions) {
        const device = toSessionDevice(sessionItem);
        if (device.key === oppositeCandidate.device.key) {
          keepSessionIds.add(sessionItem.id);
        }
      }
    }
  }

  for (const sessionItem of activeSessions) {
    if (keepSessionIds.has(sessionItem.id)) continue;
    if (!sessionItem.token) continue;
    await auth.api.revokeSession({
      headers: params.headers,
      body: { token: sessionItem.token },
    });
  }
};
