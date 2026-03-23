import { useQuery } from "@tanstack/react-query";
import { useAppAuthSnapshot } from "@/features/auth/context/app-auth-context";
import { workspaceApi } from "@/features/workspace/api/workspace-api";

export function useDashboardSummary() {
  const auth = useAppAuthSnapshot();
  const user = auth?.user;
  const roles = auth?.roles ?? [];
  const status = user?.accountStatus ?? "active";

  const summaryQuery = useQuery({
    queryKey: ["workspace-summary"],
    queryFn: () => workspaceApi.getSummary(),
  });

  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;
  const latestRequest = summary?.subscription.latestRequest ?? null;
  const summaryError =
    summaryQuery.data && !summaryQuery.data.ok ? summaryQuery.data.message : null;

  return {
    auth,
    user,
    roles,
    status,
    summary,
    latestRequest,
    summaryError,
  };
}
