import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_QUERY_KEYS } from "../constants/query-keys";
import { getCurrentSubscriptionRequest } from "../services/subscription.service";

export const useCurrentSubscriptionRequestQuery = (enabled = true) =>
  useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.currentRequest(),
    queryFn: getCurrentSubscriptionRequest,
    select: (result) => result.data,
    enabled,
  });
