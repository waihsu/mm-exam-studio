import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { verifyTwoFactor } from "../services/auth.service";

export const useVerifyTwoFactorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyTwoFactor,
    onSuccess: (result) => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, result.session);
    },
  });
};
