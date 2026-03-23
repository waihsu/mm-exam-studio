import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { signOut } from "../services/auth.service";

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
    },
  });
};
