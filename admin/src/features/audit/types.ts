export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogPage = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SuspiciousSignInAlert = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  metadata: Record<string, unknown> | null;
};

export type SuspiciousSignInAlertPage = {
  rows: SuspiciousSignInAlert[];
  total: number;
  limit: number;
  minRiskScore: number;
};
