import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_QUERY_KEYS } from "../constants/query-keys";
import { getOwnSubscriptionRequests } from "../services/subscription.service";

export const useOwnSubscriptionRequestsQuery = (enabled = true) =>
  useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.requests(),
    queryFn: getOwnSubscriptionRequests,
    enabled,
  });
