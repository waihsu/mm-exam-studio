import { Link } from "@tanstack/react-router";
import { ArrowRight, LogOut, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { userAppRoutes } from "@/constants/routes";
import { getPlanCatalogItem } from "@/features/subscription/subscription-catalog";
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

  const deviceLimit = summary?.subscription.limits.deviceLimit ?? 1;
  const errors = [queryError, revokeOthersError, revokeSessionError].filter(
    (item): item is string => Boolean(item),
  );
  const planCatalog = getPlanCatalogItem(summary?.subscription.code ?? "free");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Account"
        title="Profile and devices"
        chips={
          <>
            <span className="app-chip">{sessions.length}/{deviceLimit} devices</span>
            <span className="app-chip">{summary?.subscription.name ?? "Free"} plan</span>
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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
              <StatusRow label="Plan active" ok={(summary?.subscription.status ?? "active") === "active"} />
              <StatusRow label="Device count in limit" ok={isWithinDeviceLimit} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Plan snapshot
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {summary?.subscription.name ?? "Free"} plan
              </p>
              <p className="mt-1 text-sm text-slate-600">{planCatalog.tagline}</p>
              <div className="mt-3 space-y-2">
                <MetaRow label="Practice" value={planCatalog.limitSummary.practice} />
                <MetaRow label="Paper" value={planCatalog.limitSummary.paper} />
                <MetaRow label="Devices" value={planCatalog.limitSummary.devices} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button asChild variant="outline" className="w-full justify-between bg-white">
                <Link to={userAppRoutes.subscription}>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Compare plans
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
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
