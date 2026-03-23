import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { reorderQuestionPaperItems } from "../services/papers.service";

export const useReorderQuestionPaperItemsMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemIds: string[]) => reorderQuestionPaperItems(paperId, { itemIds }),
    onSuccess: async (result) => {
      queryClient.setQueryData(PAPERS_QUERY_KEYS.detail(paperId), result);
      await queryClient.invalidateQueries({
        queryKey: PAPERS_QUERY_KEYS.list(),
      });
    },
  });
};
