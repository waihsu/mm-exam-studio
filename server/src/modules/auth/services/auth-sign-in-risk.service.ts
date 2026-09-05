import { and, eq, gte, or, sql } from "drizzle-orm";
import { auditLog, db } from "@/db";
import { getRequestClientIp } from "@/lib/request-client-ip";

const normalizeUserAgentForRisk = (request: Request) => {
  const raw = request.headers.get("user-agent");
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
};

const toSafeCount = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
};

const resolveRiskLevel = (score: number) => {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
};

export const assessSignInRisk = async (params: {
  request: Request;
  email: string;
  userId?: string | null;
  outcome: "success" | "failed" | "blocked" | "mfa";
}) => {
  const ipAddress = getRequestClientIp(params.request);
  const userAgent = normalizeUserAgentForRisk(params.request);
  const now = Date.now();
  const failedWindowStart = new Date(now - 15 * 60 * 1000);
  const familiarityWindowStart = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const failedActions = [
    "auth.sign_in_failed",
    "auth.sign_in_blocked",
    "auth.device_blocked",
  ];

  const [
    failedFromIpCount,
    failedForEmailCount,
    successfulFromIpCount,
    successfulFromUaCount,
  ] = await Promise.all([
    ipAddress
      ? db
          .select({ total: sql<number>`count(*)` })
          .from(auditLog)
          .where(
            and(
              gte(auditLog.createdAt, failedWindowStart),
              eq(auditLog.ipAddress, ipAddress),
              or(...failedActions.map((action) => eq(auditLog.action, action))),
            ),
          )
          .then((rows) => toSafeCount(rows[0]?.total))
      : Promise.resolve(0),
    db
      .select({ total: sql<number>`count(*)` })
      .from(auditLog)
      .where(
        and(
          gte(auditLog.createdAt, failedWindowStart),
          or(...failedActions.map((action) => eq(auditLog.action, action))),
          sql`coalesce(${auditLog.metadata} ->> 'email', '') = ${params.email}`,
        ),
      )
      .then((rows) => toSafeCount(rows[0]?.total)),
    params.userId && ipAddress
      ? db
          .select({ total: sql<number>`count(*)` })
          .from(auditLog)
          .where(
            and(
              gte(auditLog.createdAt, familiarityWindowStart),
              eq(auditLog.action, "auth.sign_in"),
              eq(auditLog.actorUserId, params.userId),
              eq(auditLog.ipAddress, ipAddress),
            ),
          )
          .then((rows) => toSafeCount(rows[0]?.total))
      : Promise.resolve(0),
    params.userId && userAgent
      ? db
          .select({ total: sql<number>`count(*)` })
          .from(auditLog)
          .where(
            and(
              gte(auditLog.createdAt, familiarityWindowStart),
              eq(auditLog.action, "auth.sign_in"),
              eq(auditLog.actorUserId, params.userId),
              eq(auditLog.userAgent, userAgent),
            ),
          )
          .then((rows) => toSafeCount(rows[0]?.total))
      : Promise.resolve(0),
  ]);

  const reasons: string[] = [];
  let score = 0;

  if (failedFromIpCount >= 6) {
    score += 40;
    reasons.push("many_recent_failures_from_ip");
  } else if (failedFromIpCount >= 3) {
    score += 25;
    reasons.push("repeated_failures_from_ip");
  }

  if (failedForEmailCount >= 6) {
    score += 35;
    reasons.push("many_recent_failures_for_email");
  } else if (failedForEmailCount >= 3) {
    score += 20;
    reasons.push("repeated_failures_for_email");
  }

  if (params.userId && ipAddress && successfulFromIpCount === 0) {
    score += 20;
    reasons.push("new_ip_for_user");
  }

  if (params.userId && userAgent && successfulFromUaCount === 0) {
    score += 12;
    reasons.push("new_device_profile");
  }

  if (params.outcome === "failed") {
    score += 12;
    reasons.push("authentication_failed");
  } else if (params.outcome === "blocked") {
    score += 25;
    reasons.push("blocked_by_policy");
  } else if (params.outcome === "mfa") {
    score += 5;
    reasons.push("mfa_challenge_required");
  }

  if (!ipAddress) {
    score += 8;
    reasons.push("missing_ip");
  }

  const boundedScore = Math.max(0, Math.min(score, 100));
  const riskLevel = resolveRiskLevel(boundedScore);
  const suspicious =
    boundedScore >= 60 ||
    failedFromIpCount >= 6 ||
    failedForEmailCount >= 6 ||
    (params.outcome !== "success" && boundedScore >= 40);

  return {
    riskScore: boundedScore,
    riskLevel,
    suspicious,
    reasons,
    signals: {
      failedFromIp15m: failedFromIpCount,
      failedForEmail15m: failedForEmailCount,
      knownIpForUser30d: successfulFromIpCount,
      knownDeviceForUser30d: successfulFromUaCount,
    },
  };
};
