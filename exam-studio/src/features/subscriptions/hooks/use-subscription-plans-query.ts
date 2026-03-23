import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_QUERY_KEYS } from "../constants/query-keys";
import { getSubscriptionPlans } from "../services/subscription.service";

export const useSubscriptionPlansQuery = (enabled = true) =>
  useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.plans(),
    queryFn: getSubscriptionPlans,
    enabled,
  });
