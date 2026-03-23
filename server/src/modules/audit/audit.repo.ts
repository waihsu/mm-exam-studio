import {
  and,
  count as dbCount,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { auditLog, db, user } from "@/db";

export type FindAuditLogFilters = {
  q?: string;
  action?: string;
  actionPrefix?: string;
  entityType?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

const buildWhereCondition = (filters: Omit<FindAuditLogFilters, "page" | "pageSize">) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(auditLog.action, pattern),
        ilike(auditLog.entityType, pattern),
        ilike(auditLog.entityId, pattern),
        ilike(user.email, pattern),
        ilike(user.name, pattern),
      )!,
    );
  }

  if (filters.action) {
    conditions.push(eq(auditLog.action, filters.action));
  }

  if (filters.actionPrefix) {
    conditions.push(ilike(auditLog.action, `${filters.actionPrefix}%`));
  }

  if (filters.entityType) {
    conditions.push(eq(auditLog.entityType, filters.entityType));
  }

  if (filters.actorUserId) {
    conditions.push(eq(auditLog.actorUserId, filters.actorUserId));
  }

  if (filters.from) {
    conditions.push(gte(auditLog.createdAt, filters.from));
  }

  if (filters.to) {
    conditions.push(lte(auditLog.createdAt, filters.to));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const auditRepo = {
  create: (data: {
    action: string;
    actorUserId?: string | null;
    entityType?: string;
    entityId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }) => db.insert(auditLog).values(data),

  findPage: async ({ page, pageSize, ...filters }: FindAuditLogFilters) => {
    const where = buildWhereCondition(filters);
    const offset = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          actorUserId: auditLog.actorUserId,
          actorName: user.name,
          actorEmail: user.email,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.actorUserId, user.id))
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: dbCount() })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.actorUserId, user.id))
        .where(where)
        .then((result) => result[0]?.total ?? 0),
    ]);

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },
};
