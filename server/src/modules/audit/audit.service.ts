import { auditRepo, type FindAuditLogFilters } from "./audit.repo";

const normalizeMetadata = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const writeAuditLog = async (payload: {
  action: string;
  actorUserId?: string | null;
  entityType?: string;
  entityId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}) => {
  return auditRepo.create({
    action: payload.action,
    actorUserId: payload.actorUserId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    metadata: payload.metadata,
  });
};

export const listAuditLogs = async (filters: FindAuditLogFilters) => {
  const result = await auditRepo.findPage(filters);

  return {
    rows: result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      metadata: normalizeMetadata(row.metadata),
      createdAt: row.createdAt,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const isSuspiciousSignInAction = (action: string) =>
  action === "auth.sign_in" ||
  action === "auth.sign_in_failed" ||
  action === "auth.sign_in_blocked" ||
  action === "auth.device_blocked" ||
  action === "auth.sign_in_requires_mfa";

export const listSuspiciousSignInAlerts = async (params: {
  limit: number;
  minRiskScore: number;
}) => {
  const fetchSize = Math.min(500, Math.max(params.limit * 4, 120));

  const result = await auditRepo.findPage({
    actionPrefix: "auth.",
    page: 1,
    pageSize: fetchSize,
  });

  const rows = result.rows
    .map((row) => {
      const metadata = normalizeMetadata(row.metadata) ?? {};
      const riskScore = toNumber(metadata.riskScore, 0);
      const riskLevel =
        typeof metadata.riskLevel === "string" ? metadata.riskLevel : "low";
      const suspicious = metadata.suspicious === true;
      const reasons =
        Array.isArray(metadata.reasons) && metadata.reasons.length > 0
          ? metadata.reasons.filter((item): item is string => typeof item === "string")
          : [];
      const isRiskyAction =
        row.action === "auth.sign_in_failed" ||
        row.action === "auth.sign_in_blocked" ||
        row.action === "auth.device_blocked";
      const flagged = suspicious || riskScore >= params.minRiskScore || isRiskyAction;

      return {
        id: row.id,
        action: row.action,
        actorUserId: row.actorUserId,
        actorName: row.actorName,
        actorEmail: row.actorEmail,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
        riskScore,
        riskLevel,
        reasons,
        metadata,
        flagged,
      };
    })
    .filter((row) => row.flagged && isSuspiciousSignInAction(row.action))
    .slice(0, params.limit);

  return {
    rows,
    total: rows.length,
    limit: params.limit,
    minRiskScore: params.minRiskScore,
  };
};
