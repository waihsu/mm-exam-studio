import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_QUERY_KEYS } from "../constants/query-keys";
import { getSubscriptionPaymentConfig } from "../services/subscription.service";

export const useSubscriptionPaymentConfigQuery = (enabled = true) =>
  useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.paymentConfig(),
    queryFn: getSubscriptionPaymentConfig,
    enabled,
  });

