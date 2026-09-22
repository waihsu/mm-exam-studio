import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, FileText, Target } from "lucide-react";
import studyAppLogo from "@/assets/brand-mark-compact.png";
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
    <div className="min-h-dvh bg-[#eef2f8] p-0 text-[#172033] sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-dvh max-w-[1500px] overflow-hidden bg-white shadow-[0_32px_90px_-58px_rgba(23,32,51,0.32)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:border sm:border-slate-200 lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="relative hidden overflow-hidden p-10 text-white lg:block xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.34),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(200,242,122,0.18),transparent_38%),#172033]" />
          <div className="absolute -right-28 top-20 h-96 w-96 rounded-full border border-[#e7efe9]/10" />
          <div className="absolute -right-8 top-36 h-64 w-64 rounded-full border border-[#e7efe9]/10" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#e7efe9]/30 to-transparent" />

          <div className="relative flex h-full max-w-xl flex-col">
            <Link to="/" className="inline-flex w-fit items-center gap-3">
              <img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10 rounded-xl" />
              <span>
                <span className="block text-sm font-extrabold tracking-tight">MM Exam Studio</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#c8f27a]">Academic workspace</span>
              </span>
            </Link>

            <div className="my-auto py-14">
              <p className="ink-kicker text-[#c8f27a]">Focused learning, properly organised</p>
              <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] xl:text-6xl">Study work, with a sense of direction.</h1>
              <p className="mt-7 max-w-lg text-[0.9375rem] leading-8 text-[#d8d4c9]">MM Exam Studio turns a question bank into focused practice and print-ready papers—without losing the thread of what you have already done.</p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-[#c8f27a]" /><div><p className="text-sm font-bold">Practise with intent</p><p className="mt-1 text-sm leading-6 text-[#a8ada5]">Choose a syllabus scope and answer one clear question at a time.</p></div></div>
                <div className="flex gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#c8f27a]" /><div><p className="text-sm font-bold">Create with confidence</p><p className="mt-1 text-sm leading-6 text-[#a8ada5]">Build a paper draft, refine questions, and export when it is ready.</p></div></div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-[#a8ada5]"><Check className="h-4 w-4 text-[#c8f27a]" /> One workspace for practice, papers, and progress.</div>
          </div>
        </section>

        <section className="flex min-w-0 items-center bg-white p-5 sm:p-10 lg:p-12 xl:p-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-12 flex items-center justify-between">
              <Link to="/" className="text-sm font-semibold text-[#6e706b] transition hover:text-[#202321]">← Back to home</Link>
              <Link to="/" className="flex items-center gap-2 lg:hidden"><img src={studyAppLogo} alt="MM Exam Studio" className="h-9 w-9 rounded-lg" /><span className="text-sm font-extrabold">MM Exam Studio</span></Link>
            </div>
            <div key={location.pathname} className="route-transition"><Outlet /></div>
            <p className="mt-11 border-t border-[#d8d4c9] pt-5 text-xs leading-6 text-[#6e706b]">Your account gives you access to practice sessions, question paper drafts, and exports in one private workspace.</p>
            <Link to="/" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#48766b] hover:text-[#2b554d]">Explore MM Exam Studio <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
