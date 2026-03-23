import { useQuery } from "@tanstack/react-query";
import { WORKSPACE_QUERY_KEYS } from "../constants/query-keys";
import { getWorkspaceSummary } from "../services/workspace.service";

export const useWorkspaceSummaryQuery = (enabled = true) =>
  useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.summary(),
    queryFn: getWorkspaceSummary,
    enabled,
  });
