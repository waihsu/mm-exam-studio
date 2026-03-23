import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "@/core/types/app";
import { writeAuditLogFromRequest } from "@/lib/audit";
import { readPositiveNumberParam } from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  listAdminUserDevices,
  revokeAdminUserDevice,
} from "../services/admin-user-device.service";
import { listAdminUserDirectoryPage } from "../services/admin-user-directory.service";

export const userAdminRoute = new Hono<AppBindings>();

const toAdminUsersHttpError = (error: unknown, fallbackMessage: string): never => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  if (message === "USER_NOT_FOUND" || message === "DEVICE_NOT_FOUND") {
    throw new HTTPException(404, { message: "Resource not found." });
  }
  if (error instanceof Error) {
    throw new HTTPException(400, { message });
  }
  throw new HTTPException(500, { message: fallbackMessage });
};

userAdminRoute.get("/admin/directory", async (c) => {
  const role = c.req.query("role");
  const accountStatus = c.req.query("accountStatus");

  const result = await listAdminUserDirectoryPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
    search: c.req.query("search") ?? undefined,
    role: role === "user" || role === "admin" ? role : undefined,
    accountStatus:
      accountStatus === "active" ||
      accountStatus === "suspended" ||
      accountStatus === "deactivated"
        ? accountStatus
        : undefined,
  });

  return c.json(result);
});

userAdminRoute.get("/admin/:userId/devices", async (c) => {
  try {
    const result = await listAdminUserDevices(c.req.param("userId"));
    return c.json(result);
  } catch (error) {
    toAdminUsersHttpError(error, "Failed to load user devices.");
  }
});

userAdminRoute.post("/admin/:userId/devices/:deviceId/revoke", async (c) => {
  try {
    const { user: actor } = await ensureAuthContext(c);
    const userId = c.req.param("userId");
    const deviceId = c.req.param("deviceId");
    const result = await revokeAdminUserDevice({
      userId,
      deviceId,
    });

    await writeAuditLogFromRequest({
      request: c.req.raw,
      action: "admin.user_device_revoked",
      actorUserId: actor.id,
      entityType: "device_registration",
      entityId: result.deviceId,
      metadata: {
        targetUserId: userId,
        alreadyRevoked: result.alreadyRevoked,
        activeDeviceCount: result.activeDeviceCount,
        deviceType: result.device.type,
        deviceLabel: result.device.label,
      },
    });

    return c.json(result);
  } catch (error) {
    toAdminUsersHttpError(error, "Failed to revoke device.");
  }
});
