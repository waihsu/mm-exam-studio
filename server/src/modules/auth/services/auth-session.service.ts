import { HTTPException } from "hono/http-exception";
import { writeAuditLogFromRequest } from "@/lib/audit";
import { auth } from "@/lib/auth";
import {
  resolveDeviceBucket,
  selectAllowedSessionIds,
} from "@/middlewares/session-device-policy";
import { getUserDeviceLimit } from "@/modules/subscriptions/subscription.core";
import { toAuthHeaders } from "../auth.shared";
import { summarizeUserAgent } from "../auth.utils";

export const listOwnSessions = async (request: Request) => {
  const headers = toAuthHeaders(request);

  const current = await auth.api.getSession({ headers });
  if (!current?.user || !current?.session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const sessions = await auth.api.listSessions({ headers });
  const deviceLimit = await getUserDeviceLimit(current.user.id);
  const allowed = selectAllowedSessionIds(
    sessions.map((entry: any) => ({
      id: entry.id,
      userAgent: entry.userAgent,
      createdAtMs: new Date(entry.createdAt).getTime(),
    })),
    deviceLimit,
  );

  return {
    currentSessionId: current.session.id,
    sessions: sessions.map((entry: any) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      device: summarizeUserAgent(entry.userAgent),
      bucket: resolveDeviceBucket(entry.userAgent),
      allowed: allowed.has(entry.id),
    })),
  };
};

export const revokeOtherSessions = async (request: Request) => {
  const headers = toAuthHeaders(request);
  const current = await auth.api.getSession({ headers });
  if (!current?.session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const sessions = await auth.api.listSessions({ headers });
  let revokedCount = 0;

  for (const entry of sessions || []) {
    if (entry.id === current.session.id) continue;
    await auth.api.revokeSession({
      headers,
      body: { token: entry.token },
    });
    revokedCount++;
  }

  await writeAuditLogFromRequest({
    request,
    action: "auth.revoke_other_sessions",
    actorUserId: current.user?.id,
    entityId: current.session.id,
    metadata: { revokedCount },
  });

  return { revokedCount };
};

const parseSessionId = async (request: Request) => {
  const raw = (await request
    .clone()
    .json()
    .catch(() => ({}))) as { sessionId?: unknown };

  const sessionId =
    typeof raw?.sessionId === "string" && raw.sessionId.trim().length > 0
      ? raw.sessionId.trim()
      : "";

  if (!sessionId) {
    throw new HTTPException(400, { message: "Session id is required." });
  }

  return sessionId;
};

export const revokeSession = async (request: Request) => {
  const headers = toAuthHeaders(request);
  const current = await auth.api.getSession({ headers });
  if (!current?.session || !current?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const sessionId = await parseSessionId(request);
  if (sessionId === current.session.id) {
    throw new HTTPException(400, {
      message: "Use sign out to close the current session.",
    });
  }

  const sessions = await auth.api.listSessions({ headers });
  const target = sessions.find((entry: any) => entry.id === sessionId);
  if (!target?.token) {
    throw new HTTPException(404, { message: "Session not found." });
  }

  await auth.api.revokeSession({
    headers,
    body: { token: target.token },
  });

  await writeAuditLogFromRequest({
    request,
    action: "auth.revoke_session",
    actorUserId: current.user.id,
    entityId: sessionId,
  });

  return { revoked: true, sessionId };
};
