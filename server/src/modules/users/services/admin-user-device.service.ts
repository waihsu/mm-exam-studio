import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, deviceRegistration, user } from "@/db";
import { getUserDeviceLimit } from "@/modules/subscriptions/subscription.core";

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const getAdminUserIdentity = async (userId: string) => {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new Error("USER_NOT_FOUND");
  }

  return row;
};

const getActiveDeviceCount = async (userId: string) => {
  const [row] = await db
    .select({ total: count() })
    .from(deviceRegistration)
    .where(and(eq(deviceRegistration.userId, userId), isNull(deviceRegistration.revokedAt)));

  return row?.total ?? 0;
};

export const listAdminUserDevices = async (userId: string) => {
  const [targetUser, deviceLimit, rows] = await Promise.all([
    getAdminUserIdentity(userId),
    getUserDeviceLimit(userId),
    db
      .select({
        id: deviceRegistration.id,
        deviceType: deviceRegistration.deviceType,
        deviceLabel: deviceRegistration.deviceLabel,
        userAgent: deviceRegistration.userAgent,
        firstSeenAt: deviceRegistration.firstSeenAt,
        lastSeenAt: deviceRegistration.lastSeenAt,
      })
      .from(deviceRegistration)
      .where(
        and(
          eq(deviceRegistration.userId, userId),
          isNull(deviceRegistration.revokedAt),
        ),
      )
      .orderBy(desc(deviceRegistration.lastSeenAt), desc(deviceRegistration.firstSeenAt)),
  ]);

  return {
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
    },
    deviceLimit,
    activeDeviceCount: rows.length,
    devices: rows.map((row) => ({
      id: row.id,
      deviceType: row.deviceType,
      deviceLabel: row.deviceLabel,
      userAgent: row.userAgent,
      firstSeenAt: toIso(row.firstSeenAt),
      lastSeenAt: toIso(row.lastSeenAt),
    })),
  };
};

export const revokeAdminUserDevice = async (params: {
  userId: string;
  deviceId: string;
}) => {
  await getAdminUserIdentity(params.userId);

  const [target] = await db
    .select({
      id: deviceRegistration.id,
      deviceLabel: deviceRegistration.deviceLabel,
      deviceType: deviceRegistration.deviceType,
      revokedAt: deviceRegistration.revokedAt,
    })
    .from(deviceRegistration)
    .where(
      and(
        eq(deviceRegistration.id, params.deviceId),
        eq(deviceRegistration.userId, params.userId),
      ),
    )
    .limit(1);

  if (!target) {
    throw new Error("DEVICE_NOT_FOUND");
  }

  const now = new Date();
  const revokedAt = target.revokedAt ?? now;

  if (!target.revokedAt) {
    await db
      .update(deviceRegistration)
      .set({
        revokedAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(deviceRegistration.id, params.deviceId),
          eq(deviceRegistration.userId, params.userId),
          isNull(deviceRegistration.revokedAt),
        ),
      );
  }

  const activeDeviceCount = await getActiveDeviceCount(params.userId);

  return {
    userId: params.userId,
    deviceId: params.deviceId,
    revokedAt: revokedAt.toISOString(),
    alreadyRevoked: Boolean(target.revokedAt),
    activeDeviceCount,
    device: {
      label: target.deviceLabel,
      type: target.deviceType,
    },
  };
};
