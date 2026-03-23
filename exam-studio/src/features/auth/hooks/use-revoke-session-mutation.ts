import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_DEVICE_SESSIONS_QUERY_KEY } from "../constants/query-keys";
import { revokeSession } from "../services/auth.service";

export const useRevokeSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_DEVICE_SESSIONS_QUERY_KEY,
      });
    },
  });
};
