const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
};

export const SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES = readPositiveInt(
  process.env.SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES,
  1_500_000,
);

export const SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES = readPositiveInt(
  process.env.SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES,
  2_700_000,
);

const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const normalizeMultilineText = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const getSubscriptionPaymentConfig = () => ({
  channelName: normalizeOptionalText(process.env.SUBSCRIPTION_PAYMENT_CHANNEL_NAME),
  accountName: normalizeOptionalText(process.env.SUBSCRIPTION_PAYMENT_ACCOUNT_NAME),
  accountReference: normalizeOptionalText(process.env.SUBSCRIPTION_PAYMENT_ACCOUNT_REFERENCE),
  paymentUrl: normalizeOptionalText(process.env.SUBSCRIPTION_PAYMENT_URL),
  instructions: normalizeMultilineText(
    process.env.SUBSCRIPTION_PAYMENT_INSTRUCTIONS,
    "Complete payment using your manual payment channel, then submit the transaction ID and payment proof for admin review.",
  ),
  supportLabel: normalizeOptionalText(process.env.SUBSCRIPTION_SUPPORT_LABEL) ?? "Support",
  supportContact:
    normalizeOptionalText(process.env.SUBSCRIPTION_SUPPORT_CONTACT) ??
    normalizeOptionalText(process.env.SUBSCRIPTION_SUPPORT_EMAIL),
  supportUrl: normalizeOptionalText(process.env.SUBSCRIPTION_SUPPORT_URL),
  proofImageMaxBytes: SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES,
  payloadMaxBytes: SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES,
});
