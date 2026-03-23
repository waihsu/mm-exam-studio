import { createFileRoute, redirect } from "@tanstack/react-router";
import { ADMIN_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.canAccessAdmin) {
      throw redirect({ to: ADMIN_ROUTES.dashboard });
    }

    if (context.auth.user) {
      throw redirect({ to: ADMIN_ROUTES.forbidden });
    }

    throw redirect({ to: ADMIN_ROUTES.signIn });
  },
});
