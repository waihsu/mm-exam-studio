import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import {
  db,
  deviceRegistration,
  plan,
  subscription,
  supportConversation,
  user,
} from "@/db";

type AdminUserRole = "user" | "admin";
type AccountStatus = "active" | "suspended" | "deactivated";
type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired";
type BillingCycle = "monthly" | "yearly" | "lifetime";
type SupportConversationStatus = "open" | "closed";

export type AdminUserDirectoryParams = {
  page: number;
  pageSize: number;
  search?: string;
  role?: AdminUserRole;
  accountStatus?: AccountStatus;
};

export type AdminUserDirectoryRow = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminUserRole;
    accountStatus: AccountStatus;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    planCode: string;
    planName: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    endsAt: string | null;
    activeDeviceCount: number;
  } | null;
  support: {
    conversationId: string;
    status: SupportConversationStatus;
    allowUserReplies: boolean;
    unreadForAdminCount: number;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
  } | null;
};

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const getActiveDeviceCountMap = async (userIds: string[]) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db
    .select({
      userId: deviceRegistration.userId,
      total: count(),
    })
    .from(deviceRegistration)
    .where(and(inArray(deviceRegistration.userId, ids), isNull(deviceRegistration.revokedAt)))
    .groupBy(deviceRegistration.userId);

  const map = new Map<string, number>();
  for (const id of ids) {
    map.set(id, 0);
  }
  for (const row of rows) {
    map.set(row.userId, row.total);
  }
  return map;
};

const getSubscriptionMap = async (userIds: string[]) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) {
    return new Map<
      string,
      {
        planCode: string;
        planName: string;
        status: SubscriptionStatus;
        billingCycle: BillingCycle;
        endsAt: string | null;
      }
    >();
  }

  const rows = await db
    .select({
      userId: subscription.userId,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      endsAt: subscription.endsAt,
      planCode: plan.code,
      planName: plan.name,
    })
    .from(subscription)
    .innerJoin(plan, eq(subscription.planId, plan.id))
    .where(inArray(subscription.userId, ids));

  return new Map(
    rows.map((row) => [
      row.userId,
      {
        planCode: row.planCode,
        planName: row.planName,
        status: row.status,
        billingCycle: row.billingCycle,
        endsAt: toIso(row.endsAt),
      },
    ]),
  );
};

const getSupportMap = async (userIds: string[]) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) {
    return new Map<
      string,
      {
        conversationId: string;
        status: SupportConversationStatus;
        allowUserReplies: boolean;
        unreadForAdminCount: number;
        lastMessageAt: string | null;
        lastMessagePreview: string | null;
      }
    >();
  }

  const rows = await db
    .select({
      userId: supportConversation.userId,
      conversationId: supportConversation.id,
      status: supportConversation.status,
      allowUserReplies: supportConversation.allowUserReplies,
      unreadForAdminCount: supportConversation.unreadForAdminCount,
      lastMessageAt: supportConversation.lastMessageAt,
      lastMessagePreview: supportConversation.lastMessagePreview,
    })
    .from(supportConversation)
    .where(inArray(supportConversation.userId, ids));

  return new Map(
    rows.map((row) => [
      row.userId,
      {
        conversationId: row.conversationId,
        status: row.status,
        allowUserReplies: row.allowUserReplies,
        unreadForAdminCount: row.unreadForAdminCount,
        lastMessageAt: toIso(row.lastMessageAt),
        lastMessagePreview: row.lastMessagePreview ?? null,
      },
    ]),
  );
};

export const listAdminUserDirectoryPage = async (
  params: AdminUserDirectoryParams,
) => {
  const page = Math.max(1, Math.trunc(params.page || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(params.pageSize || 20)));
  const search = params.search?.trim();

  const filters = [
    ...(params.role ? [eq(user.role, params.role)] : []),
    ...(params.accountStatus ? [eq(user.accountStatus, params.accountStatus)] : []),
    ...(search
      ? [
          or(
            ilike(user.name, `%${search}%`),
            ilike(user.email, `%${search}%`),
            ilike(user.id, `%${search}%`),
          ),
        ]
      : []),
  ];

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRows, pageRows] = await Promise.all([
    db.select({ total: count() }).from(user).where(where),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.updatedAt), desc(user.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const userIds = pageRows.map((row) => row.id);
  const [deviceCountMap, subscriptionMap, supportMap] = await Promise.all([
    getActiveDeviceCountMap(userIds),
    getSubscriptionMap(userIds),
    getSupportMap(userIds),
  ]);

  const rows: AdminUserDirectoryRow[] = pageRows.map((row) => {
    const subscriptionRow = subscriptionMap.get(row.id) ?? null;
    const supportRow = supportMap.get(row.id) ?? null;

    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role as AdminUserRole,
        accountStatus: row.accountStatus as AccountStatus,
        emailVerified: row.emailVerified,
        twoFactorEnabled: row.twoFactorEnabled,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
      subscription: subscriptionRow
        ? {
            ...subscriptionRow,
            activeDeviceCount: deviceCountMap.get(row.id) ?? 0,
          }
        : null,
      support: supportRow,
    };
  });

  return {
    rows,
    total: totalRows[0]?.total ?? 0,
    page,
    pageSize,
  };
};
