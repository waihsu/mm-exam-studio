import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_DEVICE_SESSIONS_QUERY_KEY, AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { changePassword } from "../services/auth.service";

export const useChangePasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: AUTH_DEVICE_SESSIONS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: AUTH_SESSION_QUERY_KEY,
        }),
      ]);
    },
  });
};
