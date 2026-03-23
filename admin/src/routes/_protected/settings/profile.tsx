import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PagePanel } from "@/components/page-container";
import { GlassAccountSettingsCard } from "@/components/uitripled/glass-account-settings";
import { GlassProfileSettingsCard } from "@/components/uitripled/glass-profile-settings";
import { ADMIN_ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const { user, roles, apiMessage, callProtectedApi } = useAuthFlow();
  const sessionsQuery = useQuery({
    queryKey: ["admin-auth-sessions-profile"],
    queryFn: () => authApi.listSessions(),
  });

  const sessionsOverview = sessionsQuery.data?.ok ? sessionsQuery.data.data : null;
  const currentSessionId = sessionsOverview?.currentSessionId ?? null;
  const otherSessions = sessionsOverview?.sessions.filter((item) => item.id !== currentSessionId) ?? [];
  const accessLabel = roles.includes("superadmin")
    ? "Super Admin"
    : roles.includes("admin")
      ? "Admin"
      : "Limited";

  return (
    <PagePanel className="space-y-5 bg-white/88">
      <GlassProfileSettingsCard
        name={user?.name || "Admin User"}
        email={user?.email || "No email"}
        userId={user?.id || "Unavailable"}
        accessLabel={accessLabel}
        roles={roles}
        activeSessions={sessionsOverview?.sessions.length ?? 0}
        otherDevices={otherSessions.length}
        sessionStatus={sessionsQuery.isLoading ? "loading" : sessionsQuery.data?.ok ? "live" : "error"}
        securityPath={ADMIN_ROUTES.settingsSecurity}
        usersPath={ADMIN_ROUTES.users}
        onVerifyProtectedApi={() => {
          void callProtectedApi();
        }}
        verifyMessage={apiMessage}
      />

      <GlassAccountSettingsCard
        planLabel="Admin Console"
        planStatus={sessionsQuery.data?.ok ? "operational" : "check connectivity"}
        activeDevices={sessionsOverview?.sessions.length ?? 0}
        deviceLimit={Math.max((sessionsOverview?.sessions.length ?? 0) + 1, 2)}
        otherDevices={otherSessions.length}
        securityPath={ADMIN_ROUTES.settingsSecurity}
        subscriptionsPath={ADMIN_ROUTES.userSubscriptions}
      />

      {sessionsQuery.data && !sessionsQuery.data.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sessionsQuery.data.message}
        </div>
      ) : null}
    </PagePanel>
  );
}
