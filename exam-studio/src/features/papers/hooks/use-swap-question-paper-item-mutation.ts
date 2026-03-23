import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { swapQuestionPaperItem } from "../services/papers.service";

export const useSwapQuestionPaperItemMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      candidateQuestionId,
    }: {
      itemId: string;
      candidateQuestionId?: string;
    }) =>
      swapQuestionPaperItem(paperId, itemId, {
        candidateQuestionId,
      }),
    onSuccess: async (result, variables) => {
      queryClient.setQueryData(PAPERS_QUERY_KEYS.detail(paperId), result);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.swapCandidates(paperId, variables.itemId),
        }),
      ]);
    },
  });
};
