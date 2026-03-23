import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { AppAuthProvider } from "@/features/auth/context/app-auth-context";
import { loadAppAuthSnapshot } from "@/features/auth/utils/app-auth";

export const Route = createFileRoute("/_app")({
  staleTime: 30_000,
  loader: async ({ location }) => {
    const snapshot = await loadAppAuthSnapshot();
    if (!snapshot.user) {
      throw redirect({
        to: "/signin",
        search: location.href ? { redirect: location.href } : undefined,
      });
    }

    return snapshot;
  },
  component: AppLayout,
});

function AppLayout() {
  const auth = Route.useLoaderData();

  return (
    <AppAuthProvider value={auth}>
      <AppShell>
        <Outlet />
      </AppShell>
    </AppAuthProvider>
  );
}
