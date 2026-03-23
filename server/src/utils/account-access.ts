import { HTTPException } from "hono/http-exception";
import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";

import { account, authDb, session, user } from "@/db";

/* =========================================================
   TYPES
========================================================= */

export const ACCOUNT_ACCESS_STATUSES = [
  "active",
  "suspended",
  "deactivated",
] as const;

export type AccountAccessStatus = (typeof ACCOUNT_ACCESS_STATUSES)[number];

export type UserAccountAccessState = {
  userId: string;
  accountStatus: AccountAccessStatus;
  accountStatusReason: string | null;
  accountStatusChangedAt: Date | null;
  passwordResetRequiredAt: Date | null;
  hasPasswordAccount: boolean;
  passwordUpdatedAt: Date | null;
  passwordResetPending: boolean;
};

export type AccountAccessBlock = {
  code: "ACCOUNT_SUSPENDED" | "ACCOUNT_DEACTIVATED" | "PASSWORD_RESET_REQUIRED";
  message: string;
  state: UserAccountAccessState;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (
  value: string | null | undefined,
): AccountAccessStatus => {
  if (value === "suspended" || value === "deactivated") return value;
  return "active";
};

/* =========================================================
   PASSWORD META
========================================================= */

const getPasswordAccountMeta = async (userId: string) => {
  const [row] = await authDb
    .select({ updatedAt: account.updatedAt })
    .from(account)
    .where(and(eq(account.userId, userId), isNotNull(account.password)))
    .orderBy(desc(account.updatedAt))
    .limit(1);

  return {
    hasPasswordAccount: Boolean(row),
    passwordUpdatedAt: row?.updatedAt ?? null,
  };
};

const clearSatisfiedPasswordResetRequirement = async ({
  userId,
  passwordResetRequiredAt,
  passwordUpdatedAt,
}: {
  userId: string;
  passwordResetRequiredAt: Date | null;
  passwordUpdatedAt: Date | null;
}) => {
  if (!passwordResetRequiredAt || !passwordUpdatedAt) return false;
  if (passwordUpdatedAt <= passwordResetRequiredAt) return false;

  await authDb
    .update(user)
    .set({
      passwordResetRequiredAt: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return true;
};

/* =========================================================
   CORE BUILDER
========================================================= */

const buildState = async (user: {
  id: string;
  accountStatus: string;
  accountStatusReason: string | null;
  accountStatusChangedAt: Date | null;
  passwordResetRequiredAt: Date | null;
}): Promise<UserAccountAccessState> => {
  const passwordMeta = await getPasswordAccountMeta(user.id);

  const cleared = await clearSatisfiedPasswordResetRequirement({
    userId: user.id,
    passwordResetRequiredAt: user.passwordResetRequiredAt,
    passwordUpdatedAt: passwordMeta.passwordUpdatedAt,
  });

  const passwordResetRequiredAt = cleared ? null : user.passwordResetRequiredAt;

  const passwordResetPending = Boolean(
    passwordResetRequiredAt &&
    (!passwordMeta.passwordUpdatedAt ||
      passwordMeta.passwordUpdatedAt <= passwordResetRequiredAt),
  );

  return {
    userId: user.id,
    accountStatus: normalizeStatus(user.accountStatus),
    accountStatusReason: user.accountStatusReason,
    accountStatusChangedAt: user.accountStatusChangedAt,
    passwordResetRequiredAt,
    hasPasswordAccount: passwordMeta.hasPasswordAccount,
    passwordUpdatedAt: passwordMeta.passwordUpdatedAt,
    passwordResetPending,
  };
};

/* =========================================================
   PUBLIC API
========================================================= */

export const getUserAccountAccessStateById = async (
  userId: string,
): Promise<UserAccountAccessState> => {
  const [row] = await authDb
    .select({
      id: user.id,
      accountStatus: user.accountStatus,
      accountStatusReason: user.accountStatusReason,
      accountStatusChangedAt: user.accountStatusChangedAt,
      passwordResetRequiredAt: user.passwordResetRequiredAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new HTTPException(404, { message: "User not found." });
  }

  return buildState(row);
};

export const getUserAccountAccessStateByEmail = async (
  email: string,
): Promise<UserAccountAccessState | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  const [row] = await authDb
    .select({
      id: user.id,
      accountStatus: user.accountStatus,
      accountStatusReason: user.accountStatusReason,
      accountStatusChangedAt: user.accountStatusChangedAt,
      passwordResetRequiredAt: user.passwordResetRequiredAt,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!row) return null;

  return buildState(row);
};

/* =========================================================
   ACCESS BLOCK LOGIC
========================================================= */

export const getAccountAccessBlock = (
  state: UserAccountAccessState,
): AccountAccessBlock | null => {
  if (state.accountStatus === "suspended") {
    return {
      code: "ACCOUNT_SUSPENDED",
      message:
        state.accountStatusReason?.trim() || "This account is suspended.",
      state,
    };
  }

  if (state.accountStatus === "deactivated") {
    return {
      code: "ACCOUNT_DEACTIVATED",
      message:
        state.accountStatusReason?.trim() || "This account is deactivated.",
      state,
    };
  }

  if (state.passwordResetPending) {
    return {
      code: "PASSWORD_RESET_REQUIRED",
      message:
        "Password reset required. Please reset your password before continuing.",
      state,
    };
  }

  return null;
};

/* =========================================================
   SESSION REVOKE
========================================================= */

export const revokeUserSessions = async (
  userId: string,
  { excludeSessionId }: { excludeSessionId?: string | null } = {},
) => {
  const conditions = [eq(session.userId, userId)];
  if (excludeSessionId) {
    conditions.push(ne(session.id, excludeSessionId));
  }

  const deletedSessions = await authDb
    .delete(session)
    .where(and(...conditions))
    .returning();

  return deletedSessions.length;
};
