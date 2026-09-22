import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Check, FileText, Layers3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import studyAppLogo from "@/assets/brand-mark-compact.png";
import { loadAppAuthSnapshot } from "@/features/auth/utils/app-auth";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const meQuery = useQuery({
    queryKey: ["client-user-snapshot"],
    queryFn: () => loadAppAuthSnapshot(),
  });
  const primaryTarget = meQuery.data?.user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f7f8fa] text-[#172033]">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link to="/" className="flex items-center gap-3">
          <img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10 rounded-xl" />
          <span>
            <span className="block text-sm font-extrabold tracking-tight">MM Exam Studio</span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">Academic workspace</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
          <Link to="/signin" className="px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-[#172033] sm:px-4">Sign in</Link>
          <Button asChild className="rounded-xl bg-[#172033] px-4 text-white shadow-lg shadow-[#172033]/10 hover:bg-[#293650]">
            <Link to={primaryTarget}>{meQuery.data?.user ? "Open workspace" : "Get started"}<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 pb-16 sm:px-8 sm:pb-24">
        <section className="relative grid gap-12 overflow-hidden rounded-[2rem] bg-[#172033] px-6 py-12 text-white shadow-[0_32px_80px_-42px_rgba(23,32,51,0.7)] sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,1.05fr)] lg:items-center lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="relative">
            <p className="ink-kicker text-indigo-200">A calmer way to prepare</p>
            <h1 className="mt-6 max-w-2xl text-[clamp(2.75rem,5.8vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.06em]">Study with direction. See your progress.</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Build focused practice from a structured question bank, review what you learned, and turn the same work into print-ready papers.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl bg-[#c8f27a] px-6 font-bold text-[#172033] hover:bg-[#d9fb9d]"><Link to={primaryTarget}>{meQuery.data?.user ? "Go to workspace" : "Create your workspace"}<ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/5 px-6 text-white hover:bg-white/10"><Link to="/signin">Sign in</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#c8f27a]" />Open access for core study</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#c8f27a]" />Built for Myanmar learners</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur sm:p-4">
            <div className="rounded-xl bg-[#f8fafc] p-4 text-[#172033] sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Practice session</p><h2 className="mt-1 text-lg font-extrabold">Biology · Grade 10</h2></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">In progress</span>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-500"><span>Question 07 of 20</span><span>35% complete</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[35%] rounded-full bg-indigo-600" /></div>
              <div className="mt-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Current question</p>
                <p className="mt-3 text-base font-bold leading-7 sm:text-lg">Which process allows plants to convert light energy into chemical energy?</p>
                <div className="mt-5 space-y-2"><Answer label="A" text="Respiration" /><Answer label="B" text="Photosynthesis" active /><Answer label="C" text="Transpiration" /></div>
              </div>
              <div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-500">Your answer is saved automatically</span><span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Next <ArrowRight className="h-3.5 w-3.5" /></span></div>
            </div>
          </div>
        </section>

        <section className="grid divide-y divide-slate-200 border-b border-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Value icon={Target} label="Focused practice" text="Choose a grade and subject, then work through one clear question at a time." />
          <Value icon={Layers3} label="One source of truth" text="Practice sessions and paper drafts draw from the same structured question bank." />
          <Value icon={FileText} label="Print-ready papers" text="Create, refine, finalise, and export question papers with confidence." />
        </section>

        <section className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div><p className="ink-kicker text-indigo-700">For learners and educators</p><h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-[-0.04em] sm:text-4xl">One workspace for the work that matters.</h2><p className="mt-5 max-w-xl text-[0.9375rem] leading-8 text-slate-600">Learners get a clear practice loop. Educators get a dependable way to shape questions into usable papers. Everyone starts from the same organised source.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><Audience icon={BookOpen} title="For learners" text="Practise by grade and subject, review answers, and return to the areas that need attention." /><Audience icon={FileText} title="For educators" text="Create drafts, reorder questions, add branding, and export a paper when it is ready." /></div>
        </section>

        <section className="flex flex-col gap-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-sm font-bold text-indigo-700">Ready to make study time count?</p><p className="mt-1 text-sm leading-6 text-slate-600">Create a private workspace and start with one focused session.</p></div><Button asChild className="w-fit rounded-xl bg-[#172033] text-white hover:bg-[#293650]"><Link to={primaryTarget}>Start learning <ArrowRight className="h-4 w-4" /></Link></Button></section>
      </main>
    </div>
  );
}

function Answer({ label, text, active = false }: { label: string; text: string; active?: boolean }) {
  return <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${active ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-900" : "border-slate-200 text-slate-600"}`}><span className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{label}</span>{text}</div>;
}

function Value({ icon: Icon, label, text }: { icon: typeof Target; label: string; text: string }) {
  return <article className="py-7 md:px-7 md:first:pl-0 md:last:pr-0"><Icon className="h-5 w-5 text-indigo-700" /><h2 className="mt-5 text-[1.0625rem] font-bold">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}

function Audience({ icon: Icon, title, text }: { icon: typeof BookOpen; title: string; text: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(23,32,51,0.5)]"><Icon className="h-5 w-5 text-indigo-700" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}

export default Index;
