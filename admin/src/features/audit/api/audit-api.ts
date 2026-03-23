import { requestServerJson } from "@/lib/server-http";
import type { AuditLogPage, SuspiciousSignInAlertPage } from "../types";

type ListAuditLogsParams = {
  q?: string;
  action?: string;
  actionPrefix?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

const buildQueryString = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const auditApi = {
  async listAuditLogs(params: ListAuditLogsParams = {}) {
    return requestServerJson<AuditLogPage>(
      `/api/v1/audit/logs${buildQueryString(params)}`,
    );
  },
  async listSuspiciousSignInAlerts(params: { limit?: number; minRiskScore?: number } = {}) {
    return requestServerJson<SuspiciousSignInAlertPage>(
      `/api/v1/audit/alerts/suspicious-signins${buildQueryString(params)}`,
    );
  },
};
