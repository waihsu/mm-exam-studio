import { and, desc, eq } from "drizzle-orm";
import {
  db,
  subscription,
  subscriptionRequest,
  usageCounter,
} from "@/db";
import { mapSubscriptionRequest } from "../services/subscription-shared.service";
import {
  currentPeriodKey,
  FALLBACK_PERIOD,
  mapPlanWithResolvedLimits,
  resolveEffectivePlanEntitlements,
  resolveRemaining,
  resolveSubscriptionLimits,
  type SubscriptionEntitlementReason,
} from "./subscription-core-shared.service";
import { getOrCreateFreePlan } from "./subscription-plan.service";

export const ensureCurrentSubscription = async (userId: string) => {
  const existing = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    with: { plan: true },
  });

  if (existing) return existing;

  const freePlan = await getOrCreateFreePlan();
  const period = FALLBACK_PERIOD();
  const [created] = await db
    .insert(subscription)
    .values({
      userId,
      planId: freePlan.id,
      status: "active",
      billingCycle: "monthly",
      startsAt: period.start,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    })
    .returning();

  return db.query.subscription
    .findFirst({
      where: eq(subscription.id, created.id),
      with: { plan: true },
    })
    .then((row) => {
      if (!row) throw new Error("Subscription not found after creation.");
      return row;
    });
};

const ensureUsageCounter = async (params: {
  subscriptionId: string;
  userId: string;
  periodKey: string;
}) => {
  const existing = await db.query.usageCounter.findFirst({
    where: and(
      eq(usageCounter.userId, params.userId),
      eq(usageCounter.periodKey, params.periodKey),
    ),
  });

  if (existing) {
    if (existing.subscriptionId !== params.subscriptionId) {
      const [updated] = await db
        .update(usageCounter)
        .set({
          subscriptionId: params.subscriptionId,
          updatedAt: new Date(),
        })
        .where(eq(usageCounter.id, existing.id))
        .returning();
      return updated;
    }

    return existing;
  }

  const [created] = await db
    .insert(usageCounter)
    .values({
      subscriptionId: params.subscriptionId,
      userId: params.userId,
      periodKey: params.periodKey,
    })
    .returning();

  return created;
};

export const getUserSubscriptionSnapshot = async (userId: string) => {
  const current = await ensureCurrentSubscription(userId);
  const periodKey = currentPeriodKey();
  const usage = await ensureUsageCounter({
    subscriptionId: current.id,
    userId,
    periodKey,
  });

  const limits = resolveSubscriptionLimits(current);
  const assignedPlan = mapPlanWithResolvedLimits(current.plan, limits);
  const effectivePlan = resolveEffectivePlanEntitlements(current);

  return {
    subscriptionId: current.id,
    status: current.status,
    billingCycle: current.billingCycle,
    startsAt: current.startsAt,
    endsAt: current.endsAt,
    currentPeriodStart: current.currentPeriodStart,
    currentPeriodEnd: current.currentPeriodEnd,
    periodKey,
    plan: assignedPlan,
    effectivePlan: effectivePlan.plan,
    entitlement: {
      isFallbackToFree: effectivePlan.isFallbackToFree,
      reason: effectivePlan.reason as SubscriptionEntitlementReason,
    },
    usage: {
      pdfExportsUsed: usage.pdfExportsUsed,
      paperGenerationsUsed: usage.paperGenerationsUsed,
      paperSwapsUsed: usage.paperSwapsUsed,
      chatMessagesUsed: usage.chatMessagesUsed,
    },
    remaining: {
      pdfExports: resolveRemaining(
        effectivePlan.plan.monthlyPdfExportLimit,
        usage.pdfExportsUsed,
      ),
      paperGenerations: resolveRemaining(
        effectivePlan.plan.monthlyPaperGenerationLimit,
        usage.paperGenerationsUsed,
      ),
      paperSwaps: resolveRemaining(
        effectivePlan.plan.monthlyPaperSwapLimit,
        usage.paperSwapsUsed,
      ),
    },
  };
};

export const getUserDeviceLimit = async (userId: string) => {
  const current = await ensureCurrentSubscription(userId);
  const effective = resolveEffectivePlanEntitlements(current);
  return Math.max(effective.plan.deviceLimit, 1);
};

export const getUserWorkspaceAccess = async (userId: string) => {
  const current = await ensureCurrentSubscription(userId);
  const effective = resolveEffectivePlanEntitlements(current);
  return {
    planCode: effective.plan.code,
    restrictToFreePreview: effective.plan.code === "free",
    maxQuestionsPerPractice: effective.plan.maxQuestionsPerPractice,
    maxQuestionsPerPaper: effective.plan.maxQuestionsPerPaper,
  };
};

export const getCurrentSubscriptionRequest = async (userId: string) => {
  const row = await db.query.subscriptionRequest.findFirst({
    where: eq(subscriptionRequest.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  return row
    ? mapSubscriptionRequest(row, { includePaymentProofImage: true })
    : null;
};
