import { useQueries } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { getWorkspaceCatalog } from "../services/practice.service";
import type { CatalogQueryParams, PracticeQuestionType } from "../types/practice.types";

type QuickTypeValue = PracticeQuestionType | "all";

export const useQuickTypeCountsQuery = (
  baseParams: Omit<CatalogQueryParams, "questionType" | "page" | "pageSize">,
  quickTypes: QuickTypeValue[],
) => {
  const results = useQueries({
    queries: quickTypes.map((type) => {
      const params: CatalogQueryParams = {
        ...baseParams,
        questionType: type === "all" ? undefined : type,
        page: 1,
        pageSize: 1,
      };

      return {
        queryKey: [...PRACTICE_QUERY_KEYS.catalog(params), "quick-count"] as const,
        queryFn: () => getWorkspaceCatalog(params),
        staleTime: 20_000,
      };
    }),
  });

  const counts = quickTypes.reduce<Record<string, number | null>>((next, type, index) => {
    next[type] = results[index]?.data?.total ?? null;
    return next;
  }, {});

  return {
    counts,
    isLoading: results.some((result) => result.isLoading),
    hasError: results.some((result) => result.isError),
    refetch: async () => Promise.allSettled(results.map((result) => result.refetch())),
  };
};
