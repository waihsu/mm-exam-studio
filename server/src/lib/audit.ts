import { writeAuditLog } from "@/modules/audit/audit.service";

export const writeAuditLogFromRequest = async ({
  request,
  action,
  actorUserId,
  entityType,
  entityId,
  metadata,
}: {
  request: Request;
  action: string;
  actorUserId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}) => {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      null;

    const userAgent = request.headers.get("user-agent");

    await writeAuditLog({
      action,
      actorUserId,
      entityType,
      entityId,
      ipAddress: ip,
      userAgent,
      metadata,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};
