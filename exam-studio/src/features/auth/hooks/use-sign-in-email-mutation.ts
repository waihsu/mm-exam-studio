import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { signInWithEmail } from "../services/auth.service";

export const useSignInEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signInWithEmail,
    onSuccess: (result) => {
      if (!result.requiresTwoFactor) {
        queryClient.clear();
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, result.session);
      }
    },
  });
};
