import { Link, Outlet } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ADMIN_ROUTES } from "@/constants/routes";
import adminLogo from "@/assets/brand-mark-compact.png";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.canAccessAdmin) {
      throw redirect({ to: ADMIN_ROUTES.dashboard });
    }

    if (context.auth.user) {
      throw redirect({ to: ADMIN_ROUTES.forbidden });
    }
  },
  component: AuthRouteLayout,
});

function AuthRouteLayout() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-5 py-7 text-white shadow-[0_32px_120px_-56px_rgba(15,23,42,0.9)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.25),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.28),_transparent_38%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
              <img
                src={adminLogo}
                alt="Study Admin logo"
                className="h-5 w-5 rounded-lg"
              />
              Study Admin Console
            </div>
            <div className="space-y-4">
              <h1 className="max-w-lg text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Admin authentication with clear route boundaries.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Public auth pages stay separate from protected admin pages, and
                nested sections like users and settings are ready for us to grow
                feature-by-feature.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                  Public Routes
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  `/signin` and `/signup` live inside an auth-only route group.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                  Protected Routes
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  `/dashboard`, `/users/*`, and `/settings/*` require admin
                  access.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Need access first? Visit{" "}
              <Link to={ADMIN_ROUTES.signUp} className="font-semibold text-white">
                the admin access page
              </Link>
              .
            </p>
          </div>
        </section>
        <section className="flex min-w-0 justify-center lg:justify-end">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
