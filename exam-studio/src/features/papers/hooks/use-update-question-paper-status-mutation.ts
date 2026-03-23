import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { updateQuestionPaperStatus } from "../services/papers.service";

export const useUpdateQuestionPaperStatusMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: "draft" | "finalized") =>
      updateQuestionPaperStatus(paperId, status),
    onSuccess: async (result) => {
      queryClient.setQueryData(PAPERS_QUERY_KEYS.detail(paperId), result);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.exported(),
        }),
      ]);
    },
  });
};
