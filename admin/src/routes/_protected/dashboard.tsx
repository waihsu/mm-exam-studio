import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookText,
  Layers3,
  Settings,
  UsersRound,
} from "lucide-react";
import { PageContainer, PagePanel } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, roles, isSuperAdmin } = useAuthFlow();

  const quickActions = [
    {
      title: "Question bank",
      detail: "Start with the core admin feature: taxonomy-aware question authoring.",
      to: ADMIN_ROUTES.questions,
      icon: BookText,
    },
    {
      title: "Taxonomy control",
      detail: "Manage grades, subjects, chapters, and sub chapters from nested admin routes.",
      to: ADMIN_ROUTES.taxonomyGrades,
      icon: Layers3,
    },
    {
      title: "Security settings",
      detail: "Session controls and profile settings live in sub-routes.",
      to: ADMIN_ROUTES.settingsSecurity,
      icon: Settings,
    },
    {
      title: "Manage users",
      detail: "Review admin-capable accounts and keep permissions tidy.",
      to: ADMIN_ROUTES.users,
      icon: UsersRound,
    },
  ] as const;

  return (
    <PageContainer className="space-y-4 sm:space-y-6">
      <PagePanel className="overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_35%)]" />
        <div className="relative space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/80">
            Admin Dashboard
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              The auth boundary is active now. Public auth routes stay outside,
              and this shell only renders when the signed-in account has admin
              access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              Roles: {roles.join(", ") || "none"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              Access: {isSuperAdmin ? "Superadmin" : "Admin"}
            </span>
          </div>
        </div>
      </PagePanel>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <PagePanel key={item.to} className="space-y-4 bg-white/88">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {item.title}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>
              </div>
              <Button asChild variant="outline" className="border-slate-300/80 bg-white">
                <Link to={item.to}>
                  Open section
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </PagePanel>
          );
        })}
      </div>
    </PageContainer>
  );
}
