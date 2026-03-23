import { Link, Outlet } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/i18n";
import { Button } from "@/components/ui/button";
import { PageContainer, PagePanel } from "@/components/page-container";
import { AdminAuthProvider } from "@/features/auth/context/admin-auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { loadAdminAuthSnapshot } from "@/features/auth/utils/admin-auth";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "Study Admin" },
      {
        name: "description",
        content: "Internal admin dashboard for Study App operations.",
      },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "application-name", content: "Study Admin" },
      { name: "theme-color", content: "#0f172a" },
    ],
    links: [{ rel: "canonical", href: "https://studyadmin.hsuwai.space/" }],
  }),
  beforeLoad: async () => ({ auth: await loadAdminAuthSnapshot() }),
  component: RootRouteShell,
  notFoundComponent: RootNotFound,
});

function RootRouteShell() {
  const { auth } = Route.useRouteContext();
  return (
    <LanguageProvider>
      <AdminAuthProvider value={auth}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
          <Outlet />
        </div>
        <Toaster richColors position="top-right" />
      </AdminAuthProvider>
    </LanguageProvider>
  );
}

function RootNotFound() {
  const { auth } = Route.useRouteContext();
  const homeRoute = auth.canAccessAdmin
    ? ADMIN_ROUTES.dashboard
    : ADMIN_ROUTES.signIn;

  return (
    <PageContainer size="narrow" className="md:py-14">
      <PagePanel className="bg-white/85">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600">
          The route does not exist in this admin panel.
        </p>
        <div>
          <Link to={homeRoute}>
            <Button>Go Back</Button>
          </Link>
        </div>
      </PagePanel>
    </PageContainer>
  );
}
