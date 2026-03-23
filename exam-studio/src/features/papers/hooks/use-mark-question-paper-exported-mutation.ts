import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import {
  getQuestionPaperDetail,
  markQuestionPaperExported,
} from "../services/papers.service";

export const useMarkQuestionPaperExportedMutation = (paperId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markQuestionPaperExported(paperId),
    onSuccess: async () => {
      const detail = await getQuestionPaperDetail(paperId);
      queryClient.setQueryData(PAPERS_QUERY_KEYS.detail(paperId), detail);
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
