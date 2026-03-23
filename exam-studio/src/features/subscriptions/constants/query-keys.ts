export const SUBSCRIPTION_QUERY_KEYS = {
  plans: () => ["subscriptions", "plans"] as const,
  paymentConfig: () => ["subscriptions", "payment-config"] as const,
  currentRequest: () => ["subscriptions", "current-request"] as const,
  requests: () => ["subscriptions", "requests"] as const,
};
