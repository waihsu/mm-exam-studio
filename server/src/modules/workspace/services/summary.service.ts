import {
  and,
  count as dbCount,
  eq,
  isNotNull,
  or,
  type SQL,
} from "drizzle-orm";
import {
  brandAsset,
  chapter,
  db,
  practiceSession,
  question as questionTable,
  questionPaper,
  subChapter,
} from "@/db";
import {
  getCurrentSubscriptionRequest,
  getUserSubscriptionSnapshot,
} from "../../subscriptions/subscription.core";
import { getQuestionMeta } from "../../questions/services/question-read.service";

const countPublishedQuestionsForPlan = async (
  planCode: "free" | "pro" | "premium",
) => {
  const conditions = [
    eq(questionTable.isPublished, true),
    eq(questionTable.isActive, true),
    planCode === "free"
      ? or(eq(chapter.isFreePreview, true), eq(subChapter.isFreePreview, true))
      : undefined,
  ].filter(Boolean) as SQL<unknown>[];

  const rows = await db
    .select({ total: dbCount() })
    .from(questionTable)
    .leftJoin(chapter, eq(questionTable.chapterId, chapter.id))
    .leftJoin(subChapter, eq(questionTable.subChapterId, subChapter.id))
    .where(and(...conditions));

  return rows[0]?.total ?? 0;
};

const summarizeSubscriptionRequest = (
  request:
    | {
        id: string;
        requestedPlanCode: "free" | "pro" | "premium";
        status: "pending" | "approved" | "rejected" | "canceled";
        transactionId?: string | null;
        note?: string | null;
        adminNote?: string | null;
        reviewedAt?: Date | string | null;
        createdAt: Date | string;
        updatedAt: Date | string;
      }
    | null
    | undefined,
) => {
  if (!request) return null;

  return {
    id: request.id,
    requestedPlanCode: request.requestedPlanCode,
    status: request.status,
    transactionId: request.transactionId ?? null,
    note: request.note ?? null,
    adminNote: request.adminNote ?? null,
    reviewedAt: request.reviewedAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};

export const getWorkspaceSummary = async (userId: string) => {
  let latestSubscriptionRequest: Awaited<
    ReturnType<typeof getCurrentSubscriptionRequest>
  > = null;

  try {
    latestSubscriptionRequest = await getCurrentSubscriptionRequest(userId);
  } catch (error) {
    console.warn(
      `[workspace] failed to load latest subscription request for user ${userId}`,
      error,
    );
  }

  const [
    practiceSessionsCount,
    completedPracticeCount,
    papersCount,
    exportedPapersCount,
    subscription,
    brandingCount,
  ] = await Promise.all([
    db
      .select({ total: dbCount() })
      .from(practiceSession)
      .where(eq(practiceSession.userId, userId))
      .then((rows) => rows[0]?.total ?? 0),
    db
      .select({ total: dbCount() })
      .from(practiceSession)
      .where(and(eq(practiceSession.userId, userId), eq(practiceSession.status, "completed")))
      .then((rows) => rows[0]?.total ?? 0),
    db
      .select({ total: dbCount() })
      .from(questionPaper)
      .where(eq(questionPaper.userId, userId))
      .then((rows) => rows[0]?.total ?? 0),
    db
      .select({ total: dbCount() })
      .from(questionPaper)
      .where(
        and(
          eq(questionPaper.userId, userId),
          isNotNull(questionPaper.exportedAt),
        ),
      )
      .then((rows) => rows[0]?.total ?? 0),
    getUserSubscriptionSnapshot(userId),
    db
      .select({ total: dbCount() })
      .from(brandAsset)
      .where(eq(brandAsset.userId, userId))
      .then((rows) => rows[0]?.total ?? 0),
  ]);
  const effectivePlan = subscription.effectivePlan ?? subscription.plan;
  const publishedQuestionCount = await countPublishedQuestionsForPlan(
    effectivePlan.code,
  );

  return {
    publishedQuestionCount,
    practiceSessionsCount,
    completedPracticeCount,
    papersCount,
    exportedPapersCount,
    brandingCount,
    subscription: {
      code: effectivePlan.code,
      name: effectivePlan.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      limits: {
        deviceLimit: effectivePlan.deviceLimit,
        maxQuestionsPerPractice: effectivePlan.maxQuestionsPerPractice,
        maxQuestionsPerPaper: effectivePlan.maxQuestionsPerPaper,
        monthlyPdfExportLimit: effectivePlan.monthlyPdfExportLimit,
        monthlyPaperGenerationLimit: effectivePlan.monthlyPaperGenerationLimit,
        monthlyPaperSwapLimit: effectivePlan.monthlyPaperSwapLimit,
        brandingLogoLimit: effectivePlan.brandingLogoLimit,
        chatEnabled: effectivePlan.chatEnabled,
        generatorEnabled: effectivePlan.generatorEnabled,
        offlineDrmEnabled: effectivePlan.offlineDrmEnabled,
        screenshotBlockEnabled: effectivePlan.screenshotBlockEnabled,
        printAllowed: effectivePlan.printAllowed,
      },
      usage: subscription.usage,
      remaining: subscription.remaining,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      entitlement: subscription.entitlement,
      assignedPlan: {
        code: subscription.plan.code,
        name: subscription.plan.name,
      },
      latestRequest: summarizeSubscriptionRequest(latestSubscriptionRequest),
    },
  };
};

export const getWorkspaceMeta = async () => {
  return getQuestionMeta();
};
