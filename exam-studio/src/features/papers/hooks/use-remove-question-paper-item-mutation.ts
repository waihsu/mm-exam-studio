import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { removeQuestionPaperItem } from "../services/papers.service";

export const useRemoveQuestionPaperItemMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeQuestionPaperItem(paperId, itemId),
    onSuccess: async (result, itemId) => {
      queryClient.setQueryData(PAPERS_QUERY_KEYS.detail(paperId), result);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: PAPERS_QUERY_KEYS.swapCandidates(paperId, itemId),
        }),
      ]);
    },
  });
};
