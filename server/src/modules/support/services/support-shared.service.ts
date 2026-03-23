import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  db,
  supportConversation,
  supportMessage,
  user,
} from "@/db";

export type SupportConversationStatus = "open" | "closed";
export type SupportMessageSenderRole = "user" | "admin";

export type SupportConversationSummary = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  subject: string | null;
  status: SupportConversationStatus;
  allowUserReplies: boolean;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadForAdminCount: number;
  unreadForUserCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessageRecord = {
  id: string;
  conversationId: string;
  senderRole: SupportMessageSenderRole;
  senderUserId: string | null;
  senderName: string | null;
  body: string;
  createdAt: string;
};

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const toPreview = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) {
    return normalized;
  }
  return `${normalized.slice(0, 137).trimEnd()}...`;
};

export const ensureSupportConversationForUser = async (userId: string) => {
  const existing = await db.query.supportConversation.findFirst({
    where: eq(supportConversation.userId, userId),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(supportConversation)
    .values({
      userId,
      status: "open",
    })
    .returning();

  return created;
};

export const mapSupportConversationSummary = (params: {
  row: typeof supportConversation.$inferSelect;
  userRow?: { id: string; name: string; email: string } | null;
}): SupportConversationSummary => ({
  id: params.row.id,
  userId: params.row.userId,
  user: params.userRow
    ? {
        id: params.userRow.id,
        name: params.userRow.name,
        email: params.userRow.email,
      }
    : null,
  subject: params.row.subject ?? null,
  status: params.row.status,
  allowUserReplies: params.row.allowUserReplies,
  lastMessagePreview: params.row.lastMessagePreview ?? null,
  lastMessageAt: toIso(params.row.lastMessageAt),
  unreadForAdminCount: params.row.unreadForAdminCount,
  unreadForUserCount: params.row.unreadForUserCount,
  createdAt: params.row.createdAt.toISOString(),
  updatedAt: params.row.updatedAt.toISOString(),
});

export const listSupportMessages = async (
  conversationId: string,
): Promise<SupportMessageRecord[]> => {
  const rows = await db
    .select({
      id: supportMessage.id,
      conversationId: supportMessage.conversationId,
      senderRole: supportMessage.senderRole,
      senderUserId: supportMessage.senderUserId,
      body: supportMessage.body,
      createdAt: supportMessage.createdAt,
    })
    .from(supportMessage)
    .where(eq(supportMessage.conversationId, conversationId))
    .orderBy(asc(supportMessage.createdAt));

  const senderIds = [...new Set(rows.map((row) => row.senderUserId).filter(Boolean))] as string[];
  const senderMap = new Map<string, { name: string }>();

  if (senderIds.length > 0) {
    const senderRows = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(inArray(user.id, senderIds));

    for (const senderRow of senderRows) {
      senderMap.set(senderRow.id, { name: senderRow.name });
    }
  }

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    senderRole: row.senderRole,
    senderUserId: row.senderUserId ?? null,
    senderName: row.senderUserId ? senderMap.get(row.senderUserId)?.name ?? null : null,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const addSupportMessage = async (params: {
  conversationId: string;
  senderRole: SupportMessageSenderRole;
  senderUserId: string;
  body: string;
  subject?: string;
}) => {
  const trimmedBody = params.body.trim();
  const trimmedSubject = params.subject?.trim() || null;

  const [messageRow] = await db
    .insert(supportMessage)
    .values({
      conversationId: params.conversationId,
      senderRole: params.senderRole,
      senderUserId: params.senderUserId,
      body: trimmedBody,
    })
    .returning();

  const conversationUpdate =
    params.senderRole === "admin"
      ? {
          unreadForUserCount: sql`${supportConversation.unreadForUserCount} + 1`,
          unreadForAdminCount: 0,
        }
      : {
          unreadForAdminCount: sql`${supportConversation.unreadForAdminCount} + 1`,
          unreadForUserCount: 0,
        };

  await db
    .update(supportConversation)
    .set({
      ...(trimmedSubject ? { subject: trimmedSubject } : {}),
      status: "open",
      lastMessagePreview: toPreview(trimmedBody),
      lastMessageAt: new Date(),
      updatedAt: new Date(),
      ...conversationUpdate,
    })
    .where(eq(supportConversation.id, params.conversationId));

  const senderRows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, params.senderUserId))
    .limit(1);

  return {
    id: messageRow.id,
    conversationId: messageRow.conversationId,
    senderRole: messageRow.senderRole,
    senderUserId: messageRow.senderUserId ?? null,
    senderName: senderRows[0]?.name ?? null,
    body: messageRow.body,
    createdAt: messageRow.createdAt.toISOString(),
  } satisfies SupportMessageRecord;
};

export const markSupportConversationRead = async (params: {
  conversationId: string;
  viewer: "user" | "admin";
}) => {
  await db
    .update(supportConversation)
    .set({
      ...(params.viewer === "user"
        ? { unreadForUserCount: 0 }
        : { unreadForAdminCount: 0 }),
      updatedAt: new Date(),
    })
    .where(eq(supportConversation.id, params.conversationId));
};

export const getSupportConversationById = async (conversationId: string) => {
  const [row] = await db
    .select({
      id: supportConversation.id,
      userId: supportConversation.userId,
      subject: supportConversation.subject,
      status: supportConversation.status,
      allowUserReplies: supportConversation.allowUserReplies,
      lastMessagePreview: supportConversation.lastMessagePreview,
      lastMessageAt: supportConversation.lastMessageAt,
      unreadForAdminCount: supportConversation.unreadForAdminCount,
      unreadForUserCount: supportConversation.unreadForUserCount,
      createdAt: supportConversation.createdAt,
      updatedAt: supportConversation.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(supportConversation)
    .innerJoin(user, eq(supportConversation.userId, user.id))
    .where(eq(supportConversation.id, conversationId))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapSupportConversationSummary({
    row: {
      id: row.id,
      userId: row.userId,
      subject: row.subject,
      status: row.status,
      allowUserReplies: row.allowUserReplies,
      lastMessagePreview: row.lastMessagePreview,
      lastMessageAt: row.lastMessageAt,
      unreadForAdminCount: row.unreadForAdminCount,
      unreadForUserCount: row.unreadForUserCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    userRow: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
    },
  });
};

export const listAdminSupportConversationPage = async (params: {
  page: number;
  pageSize: number;
  status?: SupportConversationStatus;
  search?: string;
}) => {
  const page = Math.max(1, Math.trunc(params.page || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(params.pageSize || 20)));
  const search = params.search?.trim();

  const where = and(
    ...(params.status ? [eq(supportConversation.status, params.status)] : []),
    ...(search
      ? [
          or(
            ilike(user.name, `%${search}%`),
            ilike(user.email, `%${search}%`),
            ilike(supportConversation.subject, `%${search}%`),
            ilike(supportConversation.lastMessagePreview, `%${search}%`),
          ),
        ]
      : []),
  );

  const totalRows = await db
    .select({ total: count() })
    .from(supportConversation)
    .innerJoin(user, eq(supportConversation.userId, user.id))
    .where(where);

  const rows = await db
    .select({
      id: supportConversation.id,
      userId: supportConversation.userId,
      subject: supportConversation.subject,
      status: supportConversation.status,
      allowUserReplies: supportConversation.allowUserReplies,
      lastMessagePreview: supportConversation.lastMessagePreview,
      lastMessageAt: supportConversation.lastMessageAt,
      unreadForAdminCount: supportConversation.unreadForAdminCount,
      unreadForUserCount: supportConversation.unreadForUserCount,
      createdAt: supportConversation.createdAt,
      updatedAt: supportConversation.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(supportConversation)
    .innerJoin(user, eq(supportConversation.userId, user.id))
    .where(where)
    .orderBy(desc(supportConversation.lastMessageAt), desc(supportConversation.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    rows: rows.map((row) =>
      mapSupportConversationSummary({
        row: {
          id: row.id,
          userId: row.userId,
          subject: row.subject,
          status: row.status,
          allowUserReplies: row.allowUserReplies,
          lastMessagePreview: row.lastMessagePreview,
          lastMessageAt: row.lastMessageAt,
          unreadForAdminCount: row.unreadForAdminCount,
          unreadForUserCount: row.unreadForUserCount,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        userRow: {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
        },
      }),
    ),
    total: totalRows[0]?.total ?? 0,
    page,
    pageSize,
  };
};
