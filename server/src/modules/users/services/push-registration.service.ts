import { and, eq, isNull, ne, or } from "drizzle-orm";
import { db, pushRegistration } from "@/db";
import type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
} from "../users.schema";

export const registerPushTokenForUser = async (
  userId: string,
  input: RegisterPushTokenInput,
) => {
  const now = new Date();
  const normalizedDeviceLabel = input.deviceLabel?.trim() || null;

  const [existing] = await db
    .select()
    .from(pushRegistration)
    .where(
      or(
        eq(pushRegistration.installationId, input.installationId),
        eq(pushRegistration.pushToken, input.pushToken),
      ),
    )
    .limit(1);

  const [saved] = existing
    ? await db
        .update(pushRegistration)
        .set({
          userId,
          installationId: input.installationId,
          provider: "expo",
          platform: input.platform,
          pushToken: input.pushToken,
          deviceLabel: normalizedDeviceLabel,
          lastSeenAt: now,
          revokedAt: null,
          updatedAt: now,
        })
        .where(eq(pushRegistration.id, existing.id))
        .returning()
    : await db
        .insert(pushRegistration)
        .values({
          userId,
          installationId: input.installationId,
          provider: "expo",
          platform: input.platform,
          pushToken: input.pushToken,
          deviceLabel: normalizedDeviceLabel,
          lastSeenAt: now,
        })
        .returning();

  await db
    .update(pushRegistration)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(pushRegistration.pushToken, input.pushToken),
        ne(pushRegistration.installationId, input.installationId),
        isNull(pushRegistration.revokedAt),
      ),
    );

  return saved;
};

export const unregisterPushTokenForUser = async (
  userId: string,
  input: UnregisterPushTokenInput,
) => {
  const now = new Date();

  const [updated] = await db
    .update(pushRegistration)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(pushRegistration.userId, userId),
        eq(pushRegistration.installationId, input.installationId),
        isNull(pushRegistration.revokedAt),
      ),
    )
    .returning();

  return {
    success: Boolean(updated),
  };
};

export const listActivePushTokensForUsers = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: pushRegistration.id,
      userId: pushRegistration.userId,
      installationId: pushRegistration.installationId,
      pushToken: pushRegistration.pushToken,
      platform: pushRegistration.platform,
    })
    .from(pushRegistration)
    .where(
      and(
        or(...userIds.map((userId) => eq(pushRegistration.userId, userId))),
        isNull(pushRegistration.revokedAt),
      ),
    );
};

export const revokePushRegistrationsByToken = async (pushTokens: string[]) => {
  if (pushTokens.length === 0) {
    return;
  }

  const now = new Date();

  await db
    .update(pushRegistration)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        or(...pushTokens.map((pushToken) => eq(pushRegistration.pushToken, pushToken))),
        isNull(pushRegistration.revokedAt),
      ),
    );
};
