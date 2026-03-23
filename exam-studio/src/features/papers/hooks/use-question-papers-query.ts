import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { listQuestionPapers } from "../services/papers.service";

export const useQuestionPapersQuery = () =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.list(),
    queryFn: listQuestionPapers,
    staleTime: 20_000,
  });

