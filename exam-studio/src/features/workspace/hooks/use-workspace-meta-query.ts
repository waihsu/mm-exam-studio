import { useQuery } from "@tanstack/react-query";
import { WORKSPACE_QUERY_KEYS } from "../constants/query-keys";
import { getWorkspaceMeta } from "../services/workspace.service";

export const useWorkspaceMetaQuery = () =>
  useQuery({
    queryKey: WORKSPACE_QUERY_KEYS.meta(),
    queryFn: getWorkspaceMeta,
  });

