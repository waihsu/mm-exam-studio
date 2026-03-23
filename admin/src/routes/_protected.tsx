import { createFileRoute, redirect } from "@tanstack/react-router";
import { ADMIN_ROUTES } from "@/constants/routes";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({
        to: ADMIN_ROUTES.signIn,
        search: {
          redirect: location.href,
        },
      });
    }

    if (!context.auth.canAccessAdmin) {
      throw redirect({ to: ADMIN_ROUTES.forbidden });
    }
  },
  component: AdminShell,
});
