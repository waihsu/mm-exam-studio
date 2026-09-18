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
    <div className="min-h-dvh bg-[#f3efe6] p-0 text-[#202321] sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-dvh max-w-[1500px] overflow-hidden bg-[#fffdf8] shadow-[0_32px_90px_-58px_rgba(32,35,33,0.32)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:border sm:border-[#d8d4c9] lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="relative hidden overflow-hidden p-10 text-white lg:block xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(215,111,85,0.32),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(127,169,157,0.25),transparent_38%),#202321]" />
          <div className="pointer-events-none absolute -right-28 top-20 h-96 w-96 rounded-full border border-[#e7efe9]/10" />
          <div className="pointer-events-none absolute -right-8 top-36 h-64 w-64 rounded-full border border-[#e7efe9]/10" />
          <div className="relative flex h-full max-w-xl flex-col">
            <Link to={ADMIN_ROUTES.signIn} className="inline-flex w-fit items-center gap-3">
              <img src={adminLogo} alt="Study Admin Console" className="h-10 w-10 rounded-xl" />
              <span>
                <span className="block text-sm font-extrabold tracking-tight">Study Admin Console</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#c8f27a]">Operations workspace</span>
              </span>
            </Link>

            <div className="my-auto py-14">
              <p className="admin-kicker text-[#c8f27a]">A calmer way to keep content reliable</p>
              <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] xl:text-6xl">
                Keep the question bank trustworthy.
              </h1>
              <p className="mt-7 max-w-lg text-[0.9375rem] leading-8 text-[#d8d4c9]">
                Every change to questions, taxonomy, and users stays inside one focused workspace.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="admin-kicker text-[#c8f27a]">Public routes</p>
                  <p className="mt-2 text-sm leading-6 text-[#a8ada5]">
                    Sign in and access requests stay separate from the protected console.
                  </p>
                </div>
                <div>
                  <p className="admin-kicker text-[#c8f27a]">Protected routes</p>
                  <p className="mt-2 text-sm leading-6 text-[#a8ada5]">
                    Questions, users, and settings are available only to approved admins.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs text-[#a8ada5]">
              Need access first? Visit{" "}
              <Link to={ADMIN_ROUTES.signUp} className="font-semibold text-[#c8f27a]">
                the admin access page
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="flex min-w-0 items-center bg-[#fffdf8] p-5 sm:p-10 lg:p-12 xl:p-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-12 flex items-center justify-between lg:hidden">
              <Link to={ADMIN_ROUTES.signIn} className="flex items-center gap-2">
                <img src={adminLogo} alt="Study Admin Console" className="h-9 w-9 rounded-lg" />
                <span className="text-sm font-extrabold">Study Admin Console</span>
              </Link>
            </div>
            <Outlet />
            <p className="mt-11 border-t border-[#d8d4c9] pt-5 text-xs leading-6 text-[#6e706b]">
              Admin access is reserved for approved operators who maintain the question bank and learner experience.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthRouteLayout;
