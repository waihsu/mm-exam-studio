import { and, eq, lt, sql } from "drizzle-orm";
import { db, usageCounter } from "@/db";
import {
  limitMessageFor,
  type UsageField,
} from "./subscription-core-shared.service";
import { getUserSubscriptionSnapshot } from "./subscription-snapshot.service";

type UsageWriteExecutor = Pick<typeof db, "update">;

const usageLimitForField = (params: {
  field: UsageField;
  snapshot: Awaited<ReturnType<typeof getUserSubscriptionSnapshot>>;
}) => {
  if (params.field === "pdfExportsUsed") {
    return params.snapshot.effectivePlan.monthlyPdfExportLimit;
  }
  if (params.field === "paperGenerationsUsed") {
    return params.snapshot.effectivePlan.monthlyPaperGenerationLimit;
  }
  return params.snapshot.effectivePlan.monthlyPaperSwapLimit;
};

const usageSetterForField = (field: UsageField) => {
  if (field === "pdfExportsUsed") {
    return { pdfExportsUsed: sql`${usageCounter.pdfExportsUsed} + 1` };
  }
  if (field === "paperGenerationsUsed") {
    return {
      paperGenerationsUsed: sql`${usageCounter.paperGenerationsUsed} + 1`,
    };
  }
  return { paperSwapsUsed: sql`${usageCounter.paperSwapsUsed} + 1` };
};

const usageLimitGuardForField = (params: {
  field: UsageField;
  limit: number | null;
}) => {
  if (typeof params.limit !== "number") {
    return undefined;
  }
  if (params.field === "pdfExportsUsed") {
    return lt(usageCounter.pdfExportsUsed, params.limit);
  }
  if (params.field === "paperGenerationsUsed") {
    return lt(usageCounter.paperGenerationsUsed, params.limit);
  }
  return lt(usageCounter.paperSwapsUsed, params.limit);
};

export const assertUsageAvailable = async (params: {
  userId: string;
  field: UsageField;
}) => {
  const snapshot = await getUserSubscriptionSnapshot(params.userId);
  const limit = usageLimitForField({
    field: params.field,
    snapshot,
  });
  const used = snapshot.usage[params.field];

  if (typeof limit === "number" && used >= limit) {
    throw new Error(limitMessageFor[params.field]);
  }

  return snapshot;
};

export const consumeUsageOrThrow = async (params: {
  userId: string;
  field: UsageField;
  executor?: UsageWriteExecutor;
}) => {
  const snapshot = await getUserSubscriptionSnapshot(params.userId);
  const limit = usageLimitForField({
    field: params.field,
    snapshot,
  });
  const limitGuard = usageLimitGuardForField({
    field: params.field,
    limit,
  });
  const executor = params.executor ?? db;
  const whereConditions = [
    eq(usageCounter.userId, params.userId),
    eq(usageCounter.periodKey, snapshot.periodKey),
    limitGuard,
  ].filter(Boolean);

  const [updated] = await executor
    .update(usageCounter)
    .set({
      ...usageSetterForField(params.field),
      updatedAt: new Date(),
    })
    .where(and(...whereConditions))
    .returning();

  if (!updated) {
    throw new Error(limitMessageFor[params.field]);
  }
};

export const incrementUsage = async (params: {
  userId: string;
  field: UsageField;
}) => {
  await consumeUsageOrThrow(params);
};
