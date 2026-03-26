import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { listPaperTemplates } from "../services/papers.service";

export const usePaperTemplatesQuery = () =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.templates(),
    queryFn: listPaperTemplates,
    staleTime: 20_000,
  });

