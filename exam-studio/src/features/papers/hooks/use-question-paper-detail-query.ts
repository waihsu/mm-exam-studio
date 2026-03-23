import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { getQuestionPaperDetail } from "../services/papers.service";

export const useQuestionPaperDetailQuery = (paperId: string) =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.detail(paperId),
    queryFn: () => getQuestionPaperDetail(paperId),
    enabled: paperId.trim().length > 0,
  });

