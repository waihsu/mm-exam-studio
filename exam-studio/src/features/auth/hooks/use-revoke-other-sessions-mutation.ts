import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_DEVICE_SESSIONS_QUERY_KEY } from "../constants/query-keys";
import { revokeOtherSessions } from "../services/auth.service";

export const useRevokeOtherSessionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_DEVICE_SESSIONS_QUERY_KEY,
      });
    },
  });
};
