import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { materializePaperTemplate } from "../services/papers.service";

export const useMaterializePaperTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: Parameters<typeof materializePaperTemplate>[1];
    }) => materializePaperTemplate(templateId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PAPERS_QUERY_KEYS.list(),
      });
    },
  });
};

