import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, FileText, Layers3, Target } from "lucide-react";
import studyAppLogo from "@/assets/brand-mark-compact.png";
import { Button } from "@/components/ui/button";
import { loadAppAuthSnapshot } from "@/features/auth/utils/app-auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const meQuery = useQuery({ queryKey: ["client-user-snapshot"], queryFn: () => loadAppAuthSnapshot() });
  const primaryTarget = meQuery.data?.user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f7f8fa] text-slate-950">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link to="/" className="flex items-center gap-3"><img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10 rounded-lg" /><span><span className="block text-sm font-extrabold tracking-tight">MM Exam Studio</span><span className="mt-0.5 block text-xs font-medium text-slate-500">Academic workspace</span></span></Link>
        <div className="flex items-center gap-2 sm:gap-3"><Link to="/signin" className="px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-[#202536] sm:px-4">Sign in</Link><Button asChild className="rounded-lg bg-[#202536] px-4 text-white hover:bg-[#313850]"><Link to={primaryTarget}>{meQuery.data?.user ? "Open workspace" : "Get started"}<ArrowRight className="h-4 w-4" /></Link></Button></div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 pb-16 sm:px-8 sm:pb-24">
        <section className="grid gap-10 border-y border-slate-200 py-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:items-end lg:gap-16 lg:py-24">
          <div>
            <p className="ink-kicker text-indigo-700">For serious study and reliable exam preparation</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3rem,6.2vw,5.75rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">Study time, turned into visible progress.</h1>
            <p className="mt-7 max-w-2xl text-[1rem] leading-8 text-slate-600 sm:text-lg">Build focused practice from a real syllabus. Work through one question at a time. Turn the same trusted question bank into a polished paper when you need it.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="rounded-lg bg-[#202536] px-6 text-white hover:bg-[#313850]"><Link to={primaryTarget}>{meQuery.data?.user ? "Go to workspace" : "Create your workspace"}<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg" className="rounded-lg border-[#bbb7aa] bg-transparent px-6 text-[#202536] hover:border-[#202536] hover:bg-white"><Link to="/signin">Sign in</Link></Button></div>
          </div>

          <aside className="relative overflow-hidden rounded-xl bg-[#202536] p-6 text-white shadow-[0_30px_60px_-42px_rgba(21,27,43,0.85)] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <p className="ink-kicker relative text-indigo-200">A complete study loop</p>
            <div className="relative mt-8 space-y-6">
              <LoopStep number="01" title="Set a clear scope" text="Choose a grade and subject, then narrow it down only when you need to." />
              <LoopStep number="02" title="Work without noise" text="Answer a focused session at your own pace, with every question in one calm flow." />
              <LoopStep number="03" title="Use the result" text="Review the outcome, repeat a weak subject, or create a paper from the same source." />
            </div>
            <div className="relative mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-slate-300"><Check className="mr-2 inline h-4 w-4 text-emerald-300" />Built for real study work, not an empty dashboard.</div>
          </aside>
        </section>

        <section className="grid divide-y divide-slate-200 border-b border-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Value icon={Target} label="Focused practice" text="Select the syllabus scope and practise in a calm, question-by-question flow." />
          <Value icon={Layers3} label="One source of truth" text="Practice sessions and paper drafts draw from the same structured question bank." />
          <Value icon={FileText} label="Print-ready papers" text="Create, refine, finalise, and export question papers with confidence." />
        </section>

        <section className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:py-24">
          <div><p className="ink-kicker text-indigo-700">Less admin. More deliberate learning.</p><h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-4xl">The tools should disappear into the work.</h2></div>
          <p className="max-w-xl text-[0.9375rem] leading-8 text-slate-600">A useful study product reduces small decisions instead of adding screens. MM Exam Studio keeps the next action clear: choose a topic, finish a session, then use what you learned.</p>
        </section>
      </main>
    </div>
  );
}

function LoopStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4"><span className="pt-0.5 text-xs font-bold tracking-[0.1em] text-indigo-200">{number}</span><div><h2 className="text-base font-bold text-white">{title}</h2><p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p></div></div>;
}

function Value({ icon: Icon, label, text }: { icon: typeof Target; label: string; text: string }) {
  return <article className="py-7 md:px-7 md:first:pl-0 md:last:pr-0"><Icon className="h-5 w-5 text-indigo-700" /><h2 className="mt-5 text-[1.0625rem] font-bold">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}

export default Index;
