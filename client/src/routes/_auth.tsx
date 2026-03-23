import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, FileOutput, ShieldCheck } from "lucide-react";
import studyAppLogo from "@/assets/study-app-logo.svg";
import { requireGuestUser } from "@/features/auth/utils/app-auth";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    await requireGuestUser();
  },
  component: AuthLayout,
});

function AuthLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-transparent px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:min-h-screen sm:px-4 sm:py-8">
      <div className="pointer-events-none absolute -top-32 -left-28 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-96px] bottom-[-160px] h-96 w-96 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl gap-4 sm:gap-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8">
        <div className="reveal-up relative hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_65px_-46px_rgba(15,23,42,0.72)] backdrop-blur-xl lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,rgba(125,211,252,0.22),transparent_42%),radial-gradient(circle_at_12%_86%,rgba(251,191,36,0.18),transparent_48%)]" />
          <div className="relative flex h-full flex-col p-10 text-slate-900">
            <div className="flex items-center gap-4">
              <img src={studyAppLogo} alt="MM Exam Studio" className="h-14 w-14" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Student Workspace
                </p>
                <h1 className="text-3xl font-semibold">MM Exam Studio</h1>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <h2 className="max-w-xl text-4xl font-semibold leading-tight text-slate-900">
                Learn faster with focused practice and cleaner exam workflows.
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                One account unlocks daily question practice, full paper building,
                export history, and subscription controls without switching apps.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/75 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Why learners stay
                </p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>Practice by grade, subject, chapter, and sub-chapter.</p>
                  <p>Build papers and export polished PDF in seconds.</p>
                  <p>Track progress from one reliable dashboard.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white/75 px-3 py-3">
                  <p className="text-lg font-semibold text-slate-900">24/7</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Access
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/75 px-3 py-3">
                  <p className="text-lg font-semibold text-slate-900">PDF</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Export
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/75 px-3 py-3">
                  <p className="text-lg font-semibold text-slate-900">Smart</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Practice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="reveal-up reveal-delay-1 relative flex min-w-0 items-center lg:items-stretch">
          <div className="my-auto w-full min-w-0 rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.52)] backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex min-w-0 items-center justify-between gap-2 sm:mb-6">
              <Link to="/" className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                Back to home
              </Link>
              <div className="flex min-w-0 items-center gap-2 lg:hidden">
                <img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10" />
                <span className="hidden truncate text-sm font-semibold text-slate-900 min-[420px]:inline">
                  MM Exam Studio
                </span>
              </div>
            </div>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 lg:hidden">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Quick value
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Practice smarter, build clean papers, and export PDF from one
                account.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <BookOpenCheck className="h-3.5 w-3.5 text-sky-600" />
                  Practice
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <FileOutput className="h-3.5 w-3.5 text-emerald-600" />
                  Export
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Secure
                </span>
              </div>
            </div>
            <div key={location.pathname} className="route-transition">
              <Outlet />
            </div>
            <div className="mt-5 hidden items-center justify-center text-xs text-slate-500 sm:flex">
              Built for fast daily practice and clean exam paper generation
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
