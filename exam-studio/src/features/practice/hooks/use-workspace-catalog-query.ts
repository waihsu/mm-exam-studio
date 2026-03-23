import { useQuery } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { getWorkspaceCatalog } from "../services/practice.service";
import type { CatalogQueryParams } from "../types/practice.types";

export const useWorkspaceCatalogQuery = (params: CatalogQueryParams, enabled = true) =>
  useQuery({
    queryKey: PRACTICE_QUERY_KEYS.catalog(params),
    queryFn: () => getWorkspaceCatalog(params),
    enabled,
    staleTime: 20_000,
  });

