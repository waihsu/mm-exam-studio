import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { PageContainer, PagePanel } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

const studyAppUrl = (
  import.meta.env.VITE_STUDY_APP_URL ?? "http://localhost:5173"
)
  .trim()
  .replace(/\/+$/, "");

export const Route = createFileRoute("/forbidden")({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: ADMIN_ROUTES.signIn });
    }

    if (context.auth.canAccessAdmin) {
      throw redirect({ to: ADMIN_ROUTES.dashboard });
    }
  },
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuthFlow();

  return (
    <PageContainer size="narrow" className="md:py-14">
      <PagePanel className="bg-white/85">
        <h1 className="text-4xl font-black text-rose-700">Access Denied</h1>
        <p className="max-w-md text-center text-sm text-slate-600">
          This account does not have permission for the admin console.
        </p>
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
          <p>Email: {user?.email ?? "unknown"}</p>
          <p>Roles: {roles.length ? roles.join(", ") : "none"}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={async () => {
              const ok = await signOut();
              if (ok) {
                await navigate({ to: ADMIN_ROUTES.signIn });
              }
            }}
          >
            Sign out
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              window.location.href = `${studyAppUrl}/sign-in`;
            }}
          >
            Open Practice App
          </Button>
        </div>
      </PagePanel>
    </PageContainer>
  );
}
