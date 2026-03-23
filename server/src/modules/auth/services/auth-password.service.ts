import { HTTPException } from "hono/http-exception";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { account, authDb, user } from "@/db";
import { writeAuditLogFromRequest } from "@/lib/audit";
import { hashAuthPassword, verifyAuthPassword } from "@/lib/auth-password";
import { auth } from "@/lib/auth";
import type { ChangePasswordInput } from "../auth.schema";
import { toAuthHeaders } from "../auth.shared";

const getPasswordAccount = async (userId: string) => {
  const [row] = await authDb
    .select({
      id: account.id,
      password: account.password,
    })
    .from(account)
    .where(and(eq(account.userId, userId), isNotNull(account.password)))
    .orderBy(desc(account.updatedAt))
    .limit(1);

  return row ?? null;
};

export const changePassword = async (
  request: Request,
  payload: ChangePasswordInput,
) => {
  const headers = toAuthHeaders(request);
  const current = await auth.api.getSession({ headers });

  if (!current?.user || !current?.session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const passwordAccount = await getPasswordAccount(current.user.id);
  if (!passwordAccount?.password) {
    throw new HTTPException(400, {
      message: "This account does not support password changes.",
    });
  }

  const isValid = await verifyAuthPassword({
    hash: passwordAccount.password,
    password: payload.currentPassword,
  }).catch(() => false);

  if (!isValid) {
    throw new HTTPException(400, { message: "Current password is incorrect." });
  }

  const nextPasswordHash = await hashAuthPassword(payload.newPassword);

  await authDb
    .update(account)
    .set({
      password: nextPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(account.id, passwordAccount.id));

  await authDb
    .update(user)
    .set({
      passwordResetRequiredAt: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, current.user.id));

  const sessions = await auth.api.listSessions({ headers });
  let revokedCount = 0;

  for (const entry of sessions || []) {
    if (entry.id === current.session.id) continue;
    await auth.api.revokeSession({
      headers,
      body: { token: entry.token },
    });
    revokedCount++;
  }

  await writeAuditLogFromRequest({
    request,
    action: "auth.change_password",
    actorUserId: current.user.id,
    entityId: current.session.id,
    metadata: { revokedCount },
  });

  return {
    success: true,
    revokedCount,
  };
};
