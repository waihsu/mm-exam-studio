import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import { formatDeviceLabel } from "../utils/device";

const AUTH_SESSIONS_QUERY_KEY = ["auth-sessions"] as const;
const WORKSPACE_SUMMARY_QUERY_KEY = ["workspace-summary"] as const;

export function useProfilePageData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, session, signOut } = useAuthFlow();

  const sessionsQuery = useQuery({
    queryKey: AUTH_SESSIONS_QUERY_KEY,
    queryFn: () => authApi.listSessions(),
  });
  const summaryQuery = useQuery({
    queryKey: WORKSPACE_SUMMARY_QUERY_KEY,
    queryFn: () => workspaceApi.getSummary(),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY });
    },
  });

  const switchAccount = async () => {
    const result = await signOut();
    if (!result.ok) return;
    await navigate({ to: "/signin" });
  };

  const sessionsOverview = sessionsQuery.data?.ok ? sessionsQuery.data.data : null;
  const currentSessionId = sessionsOverview?.currentSessionId ?? session?.id ?? null;
  const sessions = sessionsOverview?.sessions ?? [];
  const currentSession = sessions.find((item) => item.id === currentSessionId) ?? null;
  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;
  const deviceLimit = summary?.subscription.limits.deviceLimit ?? 1;
  const isWithinDeviceLimit = sessions.length <= deviceLimit;
  const currentDeviceLabel = formatDeviceLabel(currentSession?.device, currentSession?.bucket);

  const queryError = sessionsQuery.data && !sessionsQuery.data.ok ? sessionsQuery.data.message : null;
  const revokeOthersError =
    revokeOthersMutation.data && !revokeOthersMutation.data.ok
      ? revokeOthersMutation.data.message
      : null;
  const revokeSessionError =
    revokeSessionMutation.data && !revokeSessionMutation.data.ok
      ? revokeSessionMutation.data.message
      : null;

  return {
    user,
    sessionsQuery,
    sessions,
    currentSession,
    currentSessionId,
    currentDeviceLabel,
    summary,
    isWithinDeviceLimit,
    revokeOthersMutation,
    revokeSessionMutation,
    queryError,
    revokeOthersError,
    revokeSessionError,
    switchAccount,
  };
}
