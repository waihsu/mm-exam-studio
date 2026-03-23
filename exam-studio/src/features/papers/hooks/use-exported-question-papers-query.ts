import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { listExportedQuestionPapers } from "../services/papers.service";

export const useExportedQuestionPapersQuery = () =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.exported(),
    queryFn: listExportedQuestionPapers,
    staleTime: 20_000,
  });
