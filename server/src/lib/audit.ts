import { writeAuditLog } from "@/modules/audit/audit.service";
import { getRequestClientIp } from "./request-client-ip";

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
    const ip = getRequestClientIp(request);
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
