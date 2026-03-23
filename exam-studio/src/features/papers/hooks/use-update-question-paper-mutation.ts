import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { updateQuestionPaper } from "../services/papers.service";
import type { UpdateQuestionPaperInput } from "../types/papers.types";

export const useUpdateQuestionPaperMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateQuestionPaperInput) =>
      updateQuestionPaper(paperId, payload),
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
