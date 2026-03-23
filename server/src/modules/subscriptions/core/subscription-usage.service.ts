import { and, eq, sql } from "drizzle-orm";
import { db, usageCounter } from "@/db";
import {
  limitMessageFor,
  type UsageField,
} from "./subscription-core-shared.service";
import { getUserSubscriptionSnapshot } from "./subscription-snapshot.service";

export const assertUsageAvailable = async (params: {
  userId: string;
  field: UsageField;
}) => {
  const snapshot = await getUserSubscriptionSnapshot(params.userId);
  const limit =
    params.field === "pdfExportsUsed"
      ? snapshot.effectivePlan.monthlyPdfExportLimit
      : params.field === "paperGenerationsUsed"
        ? snapshot.effectivePlan.monthlyPaperGenerationLimit
        : snapshot.effectivePlan.monthlyPaperSwapLimit;
  const used = snapshot.usage[params.field];

  if (typeof limit === "number" && used >= limit) {
    throw new Error(limitMessageFor[params.field]);
  }

  return snapshot;
};

export const incrementUsage = async (params: {
  userId: string;
  field: UsageField;
}) => {
  const snapshot = await getUserSubscriptionSnapshot(params.userId);

  const setter =
    params.field === "pdfExportsUsed"
      ? { pdfExportsUsed: sql`${usageCounter.pdfExportsUsed} + 1` }
      : params.field === "paperGenerationsUsed"
        ? {
            paperGenerationsUsed: sql`${usageCounter.paperGenerationsUsed} + 1`,
          }
        : { paperSwapsUsed: sql`${usageCounter.paperSwapsUsed} + 1` };

  await db
    .update(usageCounter)
    .set({
      ...setter,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usageCounter.userId, params.userId),
        eq(usageCounter.periodKey, snapshot.periodKey),
      ),
    );
};
