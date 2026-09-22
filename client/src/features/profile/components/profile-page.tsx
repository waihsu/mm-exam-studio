import { Link } from "@tanstack/react-router";
import { ArrowRight, LogOut, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { userAppRoutes } from "@/constants/routes";
import { useProfilePageData } from "../hooks/use-profile-page-data";
import { ProfileSessionsSection } from "./profile-sessions-section";
import { InfoCard, MetaRow, StatusRow } from "./profile-shared";

export function ProfilePage() {
  const {
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
  } = useProfilePageData();

  const deviceLimit = summary?.subscription.limits.deviceLimit ?? 25;
  const errors = [queryError, revokeOthersError, revokeSessionError].filter(
    (item): item is string => Boolean(item),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Account"
        title="Profile and devices"
        chips={
          <>
            <span className="app-chip">{sessions.length}/{deviceLimit} devices</span>
            <span className="app-chip">Open access</span>
            <span className="app-chip">{isWithinDeviceLimit ? "Within limit" : "Over limit"}</span>
          </>
        }
      />

      <StatGrid>
        <InfoCard label="Name" value={user?.name || "Not set"} />
        <InfoCard label="Email" value={user?.email || "Unknown"} />
        <InfoCard label="Status" value={user?.accountStatus || "active"} />
        <InfoCard
          label="Current device"
          value={currentDeviceLabel}
        />
      </StatGrid>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <ProfileSessionsSection
          sessions={sessions}
          isLoading={sessionsQuery.isLoading}
          currentSessionId={currentSessionId}
          isRevokingOthers={revokeOthersMutation.isPending}
          isRevokingOne={revokeSessionMutation.isPending}
          onRevokeOthers={async () => {
            await revokeOthersMutation.mutateAsync();
          }}
          onRevokeSession={async (sessionId: string) => {
            await revokeSessionMutation.mutateAsync(sessionId);
          }}
          errorMessages={errors}
        />

        <aside className="stagger-children space-y-4">
          <SectionCard title="Account readiness">
            <div className="mt-3 space-y-2">
              <StatusRow label="Email verified" ok={Boolean(user?.emailVerified)} />
              <StatusRow label="Open access enabled" ok />
              <StatusRow label="Device count in limit" ok={isWithinDeviceLimit} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Access
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Open access
              </p>
              <p className="mt-1 text-sm text-slate-600">
                All core study and paper tools are available for your account.
              </p>
              <div className="mt-3 space-y-2">
                <MetaRow label="Practice" value="No session cap" />
                <MetaRow label="Paper" value="No paper cap" />
                <MetaRow label="Devices" value={`Up to ${deviceLimit}`} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button asChild variant="outline" className="w-full justify-between bg-white">
                <Link to={userAppRoutes.settings}>
                  <span>Branding settings</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Switch accounts on this device"
            description="Sign out here and choose another account."
          >
            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={() => void switchAccount()}>
                <RefreshCcw className="h-4 w-4" />
                Switch account
              </Button>
              <Button variant="outline" className="w-full bg-white" onClick={() => void switchAccount()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Current session">
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <MetaRow label="Device" value={currentDeviceLabel} />
              <MetaRow label="Type" value={currentSession?.bucket || "unknown"} />
              <MetaRow
                label="Expires"
                value={
                  currentSession?.expiresAt
                    ? new Date(currentSession.expiresAt).toLocaleString("en-US")
                  : "Unknown"
                }
              />
            </div>
          </SectionCard>
        </aside>
      </section>
    </div>
  );
}
