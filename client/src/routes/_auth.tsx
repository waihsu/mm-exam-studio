import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { ArrowRight, Check, FileText, Target, TrendingUp } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import studyAppLogo from "@/assets/brand-mark-compact.png";

export const Route = createFileRoute("/_auth")({ component: AuthLayout });

function AuthLayout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-[#eef2f8] p-0 text-[#172033] sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-dvh max-w-[1500px] overflow-hidden rounded-none bg-white shadow-[0_32px_90px_-58px_rgba(23,32,51,0.38)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:border sm:border-slate-200 lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-[#172033] p-8 text-white lg:flex lg:flex-col xl:p-12">
          <div className="pointer-events-none absolute -right-36 -top-32 h-[34rem] w-[34rem] rounded-full border border-indigo-300/15" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-20 top-32 h-32 w-32 rounded-full bg-[#c8f27a]/10 blur-2xl" />

          <div className="relative flex h-full flex-col">
            <Link to="/" className="flex w-fit items-center gap-3">
              <img src={studyAppLogo} alt="MM Exam Studio" className="h-11 w-11 rounded-xl" />
              <span><span className="block text-sm font-extrabold tracking-tight">MM Exam Studio</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8f27a]">Academic workspace</span></span>
            </Link>

            <div className="my-auto py-12 xl:py-16">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8f27a]">A calmer study loop</p>
              <h1 className="mt-5 max-w-xl text-5xl font-extrabold leading-[0.98] tracking-[-0.06em] xl:text-[4.4rem]">Turn effort into something you can see.</h1>
              <p className="mt-6 max-w-lg text-[0.98rem] leading-8 text-slate-300">Practise with a clear scope, review the result, and keep every paper draft in one organised workspace.</p>

              <div className="mt-9 max-w-md rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">This week</p><p className="mt-1 text-lg font-extrabold">Your study rhythm</p></div><TrendingUp className="h-5 w-5 text-[#c8f27a]" /></div>
                <div className="mt-5 flex items-end gap-2" aria-label="Study progress chart"><span className="h-8 flex-1 rounded-t-md bg-white/20" /><span className="h-12 flex-1 rounded-t-md bg-white/25" /><span className="h-16 flex-1 rounded-t-md bg-indigo-300/60" /><span className="h-11 flex-1 rounded-t-md bg-white/25" /><span className="h-20 flex-1 rounded-t-md bg-[#c8f27a]" /><span className="h-14 flex-1 rounded-t-md bg-indigo-300/60" /><span className="h-24 flex-1 rounded-t-md bg-[#c8f27a]" /></div>
                <div className="mt-4 flex justify-between text-[11px] text-slate-400"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2"><SmallFeature icon={Target} title="Focused practice" text="One clear question at a time." /><SmallFeature icon={FileText} title="Paper-ready work" text="Draft, refine, export." /></div>
          </div>
        </section>

        <section className="flex min-w-0 items-center bg-white p-5 sm:p-10 lg:p-12 xl:p-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-between sm:mb-12"><Link to="/" className="text-sm font-semibold text-slate-500 transition hover:text-[#172033]">← Back to home</Link><Link to="/" className="flex items-center gap-2 lg:hidden"><img src={studyAppLogo} alt="MM Exam Studio" className="h-9 w-9 rounded-lg" /><span className="text-sm font-extrabold">MM Exam Studio</span></Link></div>
            <div key={location.pathname} className="route-transition"><Outlet /></div>
            <p className="mt-10 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">Your account gives you access to practice sessions, question paper drafts, and exports in one private workspace.</p>
            <Link to="/" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900">Explore MM Exam Studio <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SmallFeature({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#c8f27a]"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div><Check className="ml-auto mt-1 h-4 w-4 shrink-0 text-emerald-300" /></div>;
}
