import { useQuery } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { getWorkspaceCatalogQuickCounts } from "../services/practice.service";
import type { CatalogQueryParams, PracticeQuestionType } from "../types/practice.types";

type QuickTypeValue = PracticeQuestionType | "all";

export const useQuickTypeCountsQuery = (
  baseParams: Omit<CatalogQueryParams, "questionType" | "page" | "pageSize">,
  quickTypes: QuickTypeValue[],
) => {
  const query = useQuery({
    queryKey: PRACTICE_QUERY_KEYS.catalogQuickCounts(baseParams),
    queryFn: () => getWorkspaceCatalogQuickCounts(baseParams),
    staleTime: 20_000,
  });

  const counts = quickTypes.reduce<Record<string, number | null>>((next, type, index) => {
    void index;
    next[type] = query.data?.[type] ?? null;
    return next;
  }, {});

  return {
    counts,
    isLoading: query.isLoading,
    hasError: query.isError,
    refetch: query.refetch,
  };
};
