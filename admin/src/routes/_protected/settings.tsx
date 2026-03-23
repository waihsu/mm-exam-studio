import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Shield, ShieldCheck, UserRound } from "lucide-react";
import { PageContainer, PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const settingsTabs = [
  {
    label: "Profile",
    to: ADMIN_ROUTES.settingsProfile,
    description: "Identity, roles, and operational account metadata",
    icon: UserRound,
  },
  {
    label: "Security",
    to: ADMIN_ROUTES.settingsSecurity,
    description: "Session control, sign-in hygiene, and audit visibility",
    icon: Shield,
  },
] as const;

export const Route = createFileRoute("/_protected/settings")({
  beforeLoad: ({ location }) => {
    if (location.pathname === ADMIN_ROUTES.settings) {
      throw redirect({ to: ADMIN_ROUTES.settingsProfile });
    }
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <PagePanel className="space-y-5 bg-white/88">
        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-[linear-gradient(125deg,rgba(15,23,42,0.03)_0%,rgba(14,116,144,0.06)_100%)] p-5 sm:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Settings
              </p>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Account Settings
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Keep admin identity details and session security in one place so operations
                stay consistent, auditable, and safe.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.to || pathname.startsWith(`${tab.to}/`);

              return (
                <Link
                  key={`${tab.to}-summary`}
                  to={tab.to}
                  className={cn(
                    "group rounded-2xl border px-4 py-3 transition-colors",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.9)]"
                      : "border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </p>
                      <p
                        className={cn(
                          "text-xs leading-5",
                          isActive ? "text-slate-200" : "text-slate-600",
                        )}
                      >
                        {tab.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                        isActive
                          ? "border-slate-200/60 text-slate-200"
                          : "border-slate-300 text-slate-500 group-hover:border-slate-400 group-hover:text-slate-700",
                      )}
                    >
                      {isActive ? "Active" : "Open"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </PagePanel>
      <Outlet />
    </PageContainer>
  );
}
