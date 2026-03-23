import type {
  SubscriptionPlan,
  SubscriptionPlanCode,
  SubscriptionRequest,
} from "@/features/subscriptions/types/subscription.types";

export const formatSubscriptionLimit = (value: number | null) =>
  typeof value === "number" ? String(value) : "No cap";

export const formatRequestStatus = (value: SubscriptionRequest["status"]) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const formatPlanCode = (value: SubscriptionPlanCode) =>
  value === "premium" ? "Premium" : value === "pro" ? "Pro" : "Free";

export const getPlanFeatureRows = (plan: SubscriptionPlan) => [
  `Practice size: ${formatSubscriptionLimit(plan.maxQuestionsPerPractice)} questions`,
  `Paper size: ${formatSubscriptionLimit(plan.maxQuestionsPerPaper)} questions`,
  `PDF exports / month: ${formatSubscriptionLimit(plan.monthlyPdfExportLimit)}`,
  `Paper generations / month: ${formatSubscriptionLimit(plan.monthlyPaperGenerationLimit)}`,
  `Paper swaps / month: ${formatSubscriptionLimit(plan.monthlyPaperSwapLimit)}`,
  `Devices: ${plan.deviceLimit}`,
  `Generator: ${plan.generatorEnabled ? "Included" : "Not included"}`,
  `Chat support: ${plan.chatEnabled ? "Included" : "Not included"}`,
];
