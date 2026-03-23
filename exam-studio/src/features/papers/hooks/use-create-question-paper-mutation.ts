import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { createQuestionPaper } from "../services/papers.service";

export const useCreateQuestionPaperMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuestionPaper,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PAPERS_QUERY_KEYS.list(),
      });
    },
  });
};

