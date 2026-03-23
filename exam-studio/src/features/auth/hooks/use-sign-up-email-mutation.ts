import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { signUpWithEmail } from "../services/auth.service";

export const useSignUpEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signUpWithEmail,
    onSuccess: (result) => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, result.session);
    },
  });
};
