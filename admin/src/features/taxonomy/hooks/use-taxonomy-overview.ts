import { useQuery } from "@tanstack/react-query";
import { taxonomyApi } from "../api/taxonomy.api";

export const taxonomyMetaQueryKey = ["taxonomy", "meta"] as const;

export function useTaxonomyMetaQuery() {
  return useQuery({
    queryKey: taxonomyMetaQueryKey,
    queryFn: async () => {
      const response = await taxonomyApi.getMeta();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });
}

export const taxonomyOverviewQueryKey = taxonomyMetaQueryKey;
export const useTaxonomyOverviewQuery = useTaxonomyMetaQuery;
