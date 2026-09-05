export type PlanCode = "free" | "pro" | "premium";

export type UsageField =
  | "pdfExportsUsed"
  | "paperGenerationsUsed"
  | "paperSwapsUsed";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired";

export type PlanEntitlements = {
  code: PlanCode;
  name: string;
  description: string | null;
  deviceLimit: number;
  maxQuestionsPerPractice: number | null;
  maxQuestionsPerPaper: number | null;
  monthlyPdfExportLimit: number | null;
  monthlyPaperGenerationLimit: number | null;
  monthlyPaperSwapLimit: number | null;
  chatEnabled: boolean;
  generatorEnabled: boolean;
  brandingLogoLimit: number;
  offlineDrmEnabled: boolean;
  screenshotBlockEnabled: boolean;
  printAllowed: boolean;
};

export type SubscriptionEntitlementReason =
  | "active"
  | "inactive_status"
  | "expired_end_date";

export const FALLBACK_PERIOD = () => {
  const now = new Date();
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
};

export const currentPeriodKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const FALLBACK_FREE_PLAN = {
  code: "free" as const,
  name: "Free",
  description:
    "Preview free lessons with modest practice, paper, and export limits.",
  deviceLimit: 2,
  maxQuestionsPerPractice: 12,
  maxQuestionsPerPaper: 12,
  monthlyPdfExportLimit: 5,
  monthlyPaperGenerationLimit: 10,
  monthlyPaperSwapLimit: 10,
  chatEnabled: false,
  generatorEnabled: true,
  brandingLogoLimit: 0,
  offlineDrmEnabled: false,
  screenshotBlockEnabled: false,
  printAllowed: true,
} as const satisfies PlanEntitlements;

export const FALLBACK_PREMIUM_LIMITS = {
  deviceLimit: 5,
  maxQuestionsPerPractice: 120,
  maxQuestionsPerPaper: 120,
  monthlyPdfExportLimit: 240,
  monthlyPaperGenerationLimit: 400,
  monthlyPaperSwapLimit: 400,
} as const;

export const FALLBACK_PREMIUM_PLAN = {
  code: "premium" as const,
  name: "Premium",
  description:
    "High-volume teacher workflow with broader access, stronger protection, and generous monthly limits.",
  ...FALLBACK_PREMIUM_LIMITS,
  chatEnabled: true,
  generatorEnabled: true,
  brandingLogoLimit: 2,
  offlineDrmEnabled: true,
  screenshotBlockEnabled: true,
  printAllowed: true,
} as const satisfies PlanEntitlements;

// The project ships as a free, self-hostable edition. We retain the existing
// subscription tables for compatibility with older databases, but do not use
// them to restrict access while this mode is enabled.
export const isOpenSourceMode = () =>
  !["0", "false", "no", "off"].includes(
    (process.env.OPEN_SOURCE_MODE ?? "true").trim().toLowerCase(),
  );

export const OPEN_SOURCE_PLAN = {
  code: "premium" as const,
  name: "Open access",
  description: "All core MM Exam Studio learning and paper tools are available.",
  deviceLimit: 25,
  maxQuestionsPerPractice: null,
  maxQuestionsPerPaper: null,
  monthlyPdfExportLimit: null,
  monthlyPaperGenerationLimit: null,
  monthlyPaperSwapLimit: null,
  chatEnabled: true,
  generatorEnabled: true,
  brandingLogoLimit: 10,
  offlineDrmEnabled: false,
  screenshotBlockEnabled: false,
  printAllowed: true,
} as const satisfies PlanEntitlements;

export const limitMessageFor = {
  pdfExportsUsed:
    "You have reached the monthly PDF export limit for your plan.",
  paperGenerationsUsed:
    "You have reached the monthly paper generation limit for your plan.",
  paperSwapsUsed: "You have reached the monthly smart swap limit for your plan.",
} satisfies Record<UsageField, string>;

export const resolveRemaining = (limit: number | null | undefined, used: number) =>
  typeof limit === "number" ? Math.max(limit - used, 0) : null;

const normalizedBasePlanFields = (plan: Pick<
  SubscriptionPlanFields,
  | "code"
  | "name"
  | "description"
  | "deviceLimit"
  | "maxQuestionsPerPractice"
  | "maxQuestionsPerPaper"
  | "monthlyPdfExportLimit"
  | "monthlyPaperGenerationLimit"
  | "monthlyPaperSwapLimit"
  | "chatEnabled"
  | "generatorEnabled"
  | "brandingLogoLimit"
  | "offlineDrmEnabled"
  | "screenshotBlockEnabled"
  | "printAllowed"
>) => (plan.code === "premium" ? FALLBACK_PREMIUM_PLAN : plan);

type SubscriptionPlanFields = {
  code: PlanCode;
  name: string;
  description: string | null;
  deviceLimit: number;
  maxQuestionsPerPractice: number | null;
  maxQuestionsPerPaper: number | null;
  monthlyPdfExportLimit: number | null;
  monthlyPaperGenerationLimit: number | null;
  monthlyPaperSwapLimit: number | null;
  chatEnabled: boolean;
  generatorEnabled: boolean;
  brandingLogoLimit: number;
  offlineDrmEnabled: boolean;
  screenshotBlockEnabled: boolean;
  printAllowed: boolean;
};

type SubscriptionOverrideFields = {
  deviceLimitOverride: number | null;
  maxQuestionsPerPracticeOverride: number | null;
  maxQuestionsPerPaperOverride: number | null;
  monthlyPdfExportLimitOverride: number | null;
  monthlyPaperGenerationLimitOverride: number | null;
  monthlyPaperSwapLimitOverride: number | null;
};

type SubscriptionPlanRow = SubscriptionOverrideFields & {
  plan: SubscriptionPlanFields;
};

const resolveSubscriptionEntitlement = (params: {
  status: SubscriptionStatus;
  endsAt: Date | null;
}) => {
  if (params.status !== "active") {
    return {
      isActive: false,
      reason: "inactive_status" as const,
    };
  }

  if (params.endsAt && params.endsAt.getTime() <= Date.now()) {
    return {
      isActive: false,
      reason: "expired_end_date" as const,
    };
  }

  return {
    isActive: true,
    reason: "active" as const,
  };
};

export const resolveSubscriptionLimits = (row: SubscriptionPlanRow) => {
  const basePlan = normalizedBasePlanFields(row.plan);
  const pdfExportLimit =
    row.monthlyPdfExportLimitOverride ?? basePlan.monthlyPdfExportLimit;
  const paperGenerationLimit =
    row.monthlyPaperGenerationLimitOverride ??
    basePlan.monthlyPaperGenerationLimit;
  const paperSwapLimit =
    row.monthlyPaperSwapLimitOverride ?? basePlan.monthlyPaperSwapLimit;
  const deviceLimit = row.deviceLimitOverride ?? basePlan.deviceLimit;
  const maxQuestionsPerPractice =
    row.maxQuestionsPerPracticeOverride ?? basePlan.maxQuestionsPerPractice;
  const maxQuestionsPerPaper =
    row.maxQuestionsPerPaperOverride ?? basePlan.maxQuestionsPerPaper;

  return {
    pdfExportLimit,
    paperGenerationLimit,
    paperSwapLimit,
    deviceLimit,
    maxQuestionsPerPractice,
    maxQuestionsPerPaper,
  };
};

export const mapPlanWithResolvedLimits = (
  planRow: Pick<
    SubscriptionPlanFields,
    | "code"
    | "name"
    | "description"
    | "chatEnabled"
    | "generatorEnabled"
    | "brandingLogoLimit"
    | "offlineDrmEnabled"
    | "screenshotBlockEnabled"
    | "printAllowed"
  >,
  limits: {
    deviceLimit: number;
    maxQuestionsPerPractice: number | null;
    maxQuestionsPerPaper: number | null;
    pdfExportLimit: number | null;
    paperGenerationLimit: number | null;
    paperSwapLimit: number | null;
  },
): PlanEntitlements => {
  const resolvedPlan = normalizedBasePlanFields({
    ...planRow,
    deviceLimit: limits.deviceLimit,
    maxQuestionsPerPractice: limits.maxQuestionsPerPractice,
    maxQuestionsPerPaper: limits.maxQuestionsPerPaper,
    monthlyPdfExportLimit: limits.pdfExportLimit,
    monthlyPaperGenerationLimit: limits.paperGenerationLimit,
    monthlyPaperSwapLimit: limits.paperSwapLimit,
  });

  return {
    code: resolvedPlan.code,
    name: resolvedPlan.name,
    description: resolvedPlan.description,
    deviceLimit: limits.deviceLimit,
    maxQuestionsPerPractice: limits.maxQuestionsPerPractice,
    maxQuestionsPerPaper: limits.maxQuestionsPerPaper,
    monthlyPdfExportLimit: limits.pdfExportLimit,
    monthlyPaperGenerationLimit: limits.paperGenerationLimit,
    monthlyPaperSwapLimit: limits.paperSwapLimit,
    chatEnabled: resolvedPlan.chatEnabled,
    generatorEnabled: resolvedPlan.generatorEnabled,
    brandingLogoLimit: resolvedPlan.brandingLogoLimit,
    offlineDrmEnabled: resolvedPlan.offlineDrmEnabled,
    screenshotBlockEnabled: resolvedPlan.screenshotBlockEnabled,
    printAllowed: resolvedPlan.printAllowed,
  };
};

export const resolveEffectivePlanEntitlements = (
  row: SubscriptionPlanRow & {
    status: SubscriptionStatus;
    endsAt: Date | null;
  },
) => {
  const entitlement = resolveSubscriptionEntitlement({
    status: row.status,
    endsAt: row.endsAt,
  });

  if (!entitlement.isActive) {
    return {
      plan: FALLBACK_FREE_PLAN,
      reason: entitlement.reason,
      isFallbackToFree: true,
    };
  }

  const limits = resolveSubscriptionLimits(row);
  return {
    plan: mapPlanWithResolvedLimits(row.plan, limits),
    reason: entitlement.reason,
    isFallbackToFree: false,
  };
};
