import { useQuery } from "@tanstack/react-query";
import { PAPERS_QUERY_KEYS } from "../constants/query-keys";
import { getQuestionPaperSwapCandidates } from "../services/papers.service";

export const useQuestionPaperSwapCandidatesQuery = (
  paperId: string,
  itemId: string | null,
  enabled = true,
) =>
  useQuery({
    queryKey: PAPERS_QUERY_KEYS.swapCandidates(paperId, itemId ?? "none"),
    queryFn: () => getQuestionPaperSwapCandidates(paperId, itemId ?? ""),
    enabled: enabled && paperId.trim().length > 0 && !!itemId,
    staleTime: 30_000,
  });
