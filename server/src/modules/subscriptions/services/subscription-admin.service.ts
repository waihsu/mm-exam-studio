import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import {
  db,
  deviceRegistration,
  plan,
  subscription,
  subscriptionRequest,
  user,
} from "@/db";
import type { ReviewSubscriptionRequestInput, UpdateSubscriptionByAdminInput } from "../subscription.schema";
import {
  ensureCurrentSubscription,
  getUserSubscriptionSnapshot,
} from "../core/subscription-snapshot.service";
import { mapSubscriptionRequest, type PlanCode, type SubscriptionRequestStatus } from "./subscription-shared.service";

type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired";

type AdminSubscriptionListParams = {
  page: number;
  pageSize: number;
  search?: string;
  planCode?: PlanCode;
  status?: SubscriptionStatus;
};

type AdminSubscriptionRequestPageParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: SubscriptionRequestStatus;
  planCode?: PlanCode;
};

const getActiveDeviceCountMap = async (userIds: string[]) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Map<string, number>();

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

const serializeAdminSubscriptionRow = async (baseUser: {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const [snapshot, deviceCountMap] = await Promise.all([
    getUserSubscriptionSnapshot(baseUser.id),
    getActiveDeviceCountMap([baseUser.id]),
  ]);

  return {
    user: {
      id: baseUser.id,
      name: baseUser.name,
      email: baseUser.email,
      role: baseUser.role,
      accountStatus: baseUser.accountStatus,
      createdAt: baseUser.createdAt,
      updatedAt: baseUser.updatedAt,
    },
    subscription: {
      id: snapshot.subscriptionId,
      status: snapshot.status,
      billingCycle: snapshot.billingCycle,
      startsAt: snapshot.startsAt,
      endsAt: snapshot.endsAt,
      currentPeriodStart: snapshot.currentPeriodStart,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      plan: {
        code: snapshot.plan.code,
        name: snapshot.plan.name,
        description: snapshot.plan.description,
      },
      defaults: {
        deviceLimit: snapshot.plan.deviceLimit,
        maxQuestionsPerPractice: snapshot.plan.maxQuestionsPerPractice,
        maxQuestionsPerPaper: snapshot.plan.maxQuestionsPerPaper,
        monthlyPdfExportLimit: snapshot.plan.monthlyPdfExportLimit,
        monthlyPaperGenerationLimit: snapshot.plan.monthlyPaperGenerationLimit,
        monthlyPaperSwapLimit: snapshot.plan.monthlyPaperSwapLimit,
        brandingLogoLimit: snapshot.plan.brandingLogoLimit,
      },
      limits: {
        deviceLimit: snapshot.plan.deviceLimit,
        maxQuestionsPerPractice: snapshot.plan.maxQuestionsPerPractice,
        maxQuestionsPerPaper: snapshot.plan.maxQuestionsPerPaper,
        monthlyPdfExportLimit: snapshot.plan.monthlyPdfExportLimit,
        monthlyPaperGenerationLimit: snapshot.plan.monthlyPaperGenerationLimit,
        monthlyPaperSwapLimit: snapshot.plan.monthlyPaperSwapLimit,
      },
      overrides: {
        deviceLimitOverride: null,
        maxQuestionsPerPracticeOverride: null,
        maxQuestionsPerPaperOverride: null,
        monthlyPdfExportLimitOverride: null,
        monthlyPaperGenerationLimitOverride: null,
        monthlyPaperSwapLimitOverride: null,
      },
      usage: snapshot.usage,
      activeDeviceCount: deviceCountMap.get(baseUser.id) ?? 0,
    },
  };
};

const findUserRowById = async (userId: string) => {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row ?? null;
};

export const getAdminSubscriptionPage = async (params: AdminSubscriptionListParams) => {
  const page = Math.max(1, Math.trunc(params.page || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(params.pageSize || 20)));
  const search = params.search?.trim();

  const where = search
    ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    : undefined;

  const baseUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.updatedAt));

  const serialized = await Promise.all(
    baseUsers.map((row) => serializeAdminSubscriptionRow(row)),
  );

  const filtered = serialized.filter((row) => {
    if (params.planCode && row.subscription.plan.code !== params.planCode) return false;
    if (params.status && row.subscription.status !== params.status) return false;
    return true;
  });

  const total = filtered.length;
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows,
    total,
    page,
    pageSize,
  };
};

export const updateSubscriptionByAdmin = async (
  userId: string,
  input: UpdateSubscriptionByAdminInput,
) => {
  const [planRow, userRow] = await Promise.all([
    db.query.plan.findFirst({
      where: eq(plan.code, input.planCode),
    }),
    findUserRowById(userId),
  ]);

  if (!userRow) {
    throw new Error("User not found.");
  }

  if (!planRow) {
    throw new Error("Plan not found.");
  }

  const existing = await ensureCurrentSubscription(userId);

  await db
    .update(subscription)
    .set({
      planId: planRow.id,
      status: input.status,
      billingCycle: input.billingCycle,
      endsAt: input.endsAt ?? null,
      deviceLimitOverride: input.deviceLimitOverride ?? null,
      maxQuestionsPerPracticeOverride: input.maxQuestionsPerPracticeOverride ?? null,
      maxQuestionsPerPaperOverride: input.maxQuestionsPerPaperOverride ?? null,
      monthlyPdfExportLimitOverride: input.monthlyPdfExportLimitOverride ?? null,
      monthlyPaperGenerationLimitOverride:
        input.monthlyPaperGenerationLimitOverride ?? null,
      monthlyPaperSwapLimitOverride: input.monthlyPaperSwapLimitOverride ?? null,
      updatedAt: new Date(),
    })
    .where(eq(subscription.id, existing.id));

  return serializeAdminSubscriptionRow(userRow);
};

export const getAdminSubscriptionRequestPage = async (
  params: AdminSubscriptionRequestPageParams,
) => {
  const page = Math.max(1, Math.trunc(params.page || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(params.pageSize || 20)));

  const rows = await db.query.subscriptionRequest.findMany({
    where: and(
      ...(params.status ? [eq(subscriptionRequest.status, params.status)] : []),
      ...(params.planCode
        ? [eq(subscriptionRequest.requestedPlanCode, params.planCode)]
        : []),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  const search = params.search?.trim().toLowerCase();
  const filtered = search
    ? rows.filter((row) => {
        const haystacks = [
          row.user?.name ?? "",
          row.user?.email ?? "",
          row.transactionId ?? "",
        ];
        return haystacks.some((value) => value.toLowerCase().includes(search));
      })
    : rows;

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows: paged.map((row) => mapSubscriptionRequest(row)),
    total,
    page,
    pageSize,
  };
};

export const getAdminSubscriptionRequestDetail = async (requestId: string) => {
  const row = await db.query.subscriptionRequest.findFirst({
    where: eq(subscriptionRequest.id, requestId),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!row) {
    throw new Error("Subscription request not found.");
  }

  return mapSubscriptionRequest(row, { includePaymentProofImage: true });
};

export const reviewSubscriptionRequest = async (
  requestId: string,
  reviewerUserId: string,
  input: ReviewSubscriptionRequestInput,
) => {
  const row = await db.query.subscriptionRequest.findFirst({
    where: eq(subscriptionRequest.id, requestId),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!row) {
    throw new Error("Subscription request not found.");
  }

  if (row.status !== "pending") {
    throw new Error("This subscription request has already been reviewed.");
  }

  let updatedPlanCode: PlanCode | null = null;

  if (input.decision === "approved") {
    const planRow = await db.query.plan.findFirst({
      where: eq(plan.code, row.requestedPlanCode),
    });

    if (!planRow) {
      throw new Error("Requested plan not found.");
    }

    const existingSubscription = await ensureCurrentSubscription(row.userId);

    await db
      .update(subscription)
      .set({
        planId: planRow.id,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, existingSubscription.id));

    updatedPlanCode = planRow.code;
  }

  const [updated] = await db
    .update(subscriptionRequest)
    .set({
      status: input.decision,
      adminNote: input.adminNote ?? null,
      reviewedBy: reviewerUserId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptionRequest.id, row.id))
    .returning();

  const refreshed = await db.query.subscriptionRequest.findFirst({
    where: eq(subscriptionRequest.id, row.id),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!refreshed) {
    throw new Error("Subscription request not found after review.");
  }

  return {
    request: mapSubscriptionRequest(
      {
        ...refreshed,
        ...updated,
      },
      { includePaymentProofImage: true },
    ),
    subscription:
      input.decision === "approved"
        ? await getUserSubscriptionSnapshot(row.userId)
        : null,
    user: refreshed.user,
    updatedPlanCode,
  };
};
