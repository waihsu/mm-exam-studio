import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { deleteQuestionPaper } from "../services/papers.service";

export const useDeleteQuestionPaperMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuestionPaper,
    onSuccess: async (_, paperId) => {
      queryClient.removeQueries({
        queryKey: PAPERS_QUERY_KEYS.detail(paperId),
      });
      await queryClient.invalidateQueries({
        queryKey: PAPERS_QUERY_KEYS.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: PAPERS_QUERY_KEYS.exported(),
      });
    },
  });
};
