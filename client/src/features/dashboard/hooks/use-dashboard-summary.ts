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
  const practiceSessionsQuery = useQuery({
    queryKey: ["workspace-practice-sessions", "dashboard"],
    queryFn: () => workspaceApi.listPracticeSessions(),
  });

  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;
  const summaryError =
    summaryQuery.data && !summaryQuery.data.ok ? summaryQuery.data.message : null;
  const practiceSessions =
    practiceSessionsQuery.data?.ok ? practiceSessionsQuery.data.data.rows : [];
  const practiceSessionsError =
    practiceSessionsQuery.data && !practiceSessionsQuery.data.ok
      ? practiceSessionsQuery.data.message
      : null;
  const isWorkspaceLoading =
    summaryQuery.isLoading || practiceSessionsQuery.isLoading;

  return {
    auth,
    user,
    roles,
    status,
    summary,
    summaryError,
    practiceSessions,
    practiceSessionsError,
    isWorkspaceLoading,
  };
}
