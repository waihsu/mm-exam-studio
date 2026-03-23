import { z } from "zod";
import { SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES } from "./services/subscription-payment-config.service";

const nullableIntOverride = z
  .union([z.number().int().min(1), z.null()])
  .optional();

const nullableDateString = z
  .union([z.string().datetime({ offset: true }), z.null()])
  .optional()
  .transform((value) => (typeof value === "string" ? new Date(value) : null));

export const updateSubscriptionByAdminSchema = z.object({
  planCode: z.enum(["free", "pro", "premium"]),
  status: z.enum(["active", "canceled", "past_due", "expired"]),
  billingCycle: z.enum(["monthly", "yearly", "lifetime"]),
  endsAt: nullableDateString,
  deviceLimitOverride: nullableIntOverride,
  maxQuestionsPerPracticeOverride: nullableIntOverride,
  maxQuestionsPerPaperOverride: nullableIntOverride,
  monthlyPdfExportLimitOverride: nullableIntOverride,
  monthlyPaperGenerationLimitOverride: nullableIntOverride,
  monthlyPaperSwapLimitOverride: nullableIntOverride,
});

export const createSubscriptionRequestSchema = z.object({
  planCode: z.enum(["pro", "premium"]),
  transactionId: z
    .string()
    .trim()
    .min(4, "Transaction ID must be at least 4 characters.")
    .max(120, "Transaction ID must be 120 characters or fewer."),
  paymentProofImageDataUrl: z
    .string()
    .trim()
    .max(2_500_000, "Payment proof image is too large.")
    .refine(
      (value) => value.startsWith("data:image/"),
      "Payment proof must be an image upload.",
    )
    .refine((value) => {
      const [, base64 = ""] = value.split(",", 2);
      if (!base64) {
        return false;
      }

      const padding =
        base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      const estimatedBytes = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
      return estimatedBytes <= SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES;
    }, `Payment proof image must be ${SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES} bytes or smaller.`)
    .optional(),
  note: z
    .string()
    .trim()
    .max(500, "Request note must be 500 characters or fewer.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export const reviewSubscriptionRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  adminNote: z
    .string()
    .trim()
    .max(500, "Admin note must be 500 characters or fewer.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type UpdateSubscriptionByAdminInput = z.infer<
  typeof updateSubscriptionByAdminSchema
>;
export type CreateSubscriptionRequestInput = z.infer<
  typeof createSubscriptionRequestSchema
>;
export type ReviewSubscriptionRequestInput = z.infer<
  typeof reviewSubscriptionRequestSchema
>;
