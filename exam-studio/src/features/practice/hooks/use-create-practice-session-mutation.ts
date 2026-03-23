import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { createPracticeSession } from "../services/practice.service";

export const useCreatePracticeSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPracticeSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PRACTICE_QUERY_KEYS.sessions(),
      });
    },
  });
};

