import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { submitPracticeSession } from "../services/practice.service";

export const useSubmitPracticeSessionMutation = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { answers: Array<{ itemId: string; answer?: string }> }) =>
      submitPracticeSession(sessionId, payload),
    onSuccess: async (result) => {
      queryClient.setQueryData(PRACTICE_QUERY_KEYS.session(sessionId), result);
      await queryClient.invalidateQueries({
        queryKey: PRACTICE_QUERY_KEYS.sessions(),
      });
    },
  });
};

