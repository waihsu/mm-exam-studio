import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WORKSPACE_QUERY_KEYS } from "@/features/workspace/constants/query-keys";
import { SUBSCRIPTION_QUERY_KEYS } from "../constants/query-keys";
import { createSubscriptionRequest } from "../services/subscription.service";

export const useCreateSubscriptionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscriptionRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SUBSCRIPTION_QUERY_KEYS.currentRequest(),
        }),
        queryClient.invalidateQueries({
          queryKey: SUBSCRIPTION_QUERY_KEYS.requests(),
        }),
        queryClient.invalidateQueries({
          queryKey: WORKSPACE_QUERY_KEYS.summary(),
        }),
      ]);
    },
  });
};
