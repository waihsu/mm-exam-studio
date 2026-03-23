import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";
import { PageContainer, PagePanel } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const userTabs = [
  { label: "Users", to: ADMIN_ROUTES.users },
  { label: "Subscriptions", to: ADMIN_ROUTES.userSubscriptions },
  { label: "Support", to: ADMIN_ROUTES.userSupport },
] as const;

export const Route = createFileRoute("/_protected/users")({
  component: UsersLayout,
});

function UsersLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <PagePanel className="space-y-5 bg-white/88">
        <div className="space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            User Administration
          </p>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Users and subscription control
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Keep people management, subscription approvals, and support operations inside one
            shared `/users` workspace without scattering admin controls.
          </p>
        </div>
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {userTabs.map((tab) => {
              const isRootUsersTab = tab.to === ADMIN_ROUTES.users;
              const isActive = isRootUsersTab
                ? pathname === tab.to
                : pathname === tab.to || pathname.startsWith(`${tab.to}/`);

              return (
                <Button
                  key={tab.to}
                  asChild
                  variant="outline"
                  className={cn(
                    "border-slate-300/80 bg-white",
                    isActive && "border-slate-900 bg-slate-900 text-white hover:bg-slate-900",
                  )}
                >
                  <Link to={tab.to}>{tab.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </PagePanel>
      <Outlet />
    </PageContainer>
  );
}
