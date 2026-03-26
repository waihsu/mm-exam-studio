import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { getPaperTemplateDetail } from "../services/papers.service";

export const usePaperTemplateDetailQuery = (templateId: string) =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.templateDetail(templateId),
    queryFn: () => getPaperTemplateDetail(templateId),
    enabled: templateId.trim().length > 0,
    staleTime: 20_000,
  });
