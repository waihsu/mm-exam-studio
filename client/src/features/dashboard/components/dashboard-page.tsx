import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  CirclePlay,
  FileText,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { SectionCard } from "@/components/ui/page-shell";
import type { PracticeSessionSummary } from "@/features/workspace/types";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { StatusRow } from "./dashboard-shared";

function scopeLabel(session: PracticeSessionSummary) {
  return [session.grade?.name, session.subject?.name].filter(Boolean).join(" · ") || "Practice session";
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function getStudyInsight(sessions: PracticeSessionSummary[]) {
  const completed = sessions.filter((session) => session.status === "completed");
  const bySubject = new Map<string, { label: string; total: number; count: number }>();

  for (const session of completed) {
    if (session.scorePercent == null || !session.subject?.id) continue;
    const current = bySubject.get(session.subject.id) ?? { label: session.subject.name, total: 0, count: 0 };
    current.total += session.scorePercent;
    current.count += 1;
    bySubject.set(session.subject.id, current);
  }

  const subjects = [...bySubject.values()];
  const weakest = subjects.length > 1
    ? subjects.reduce((lowest, current) => current.total / current.count < lowest.total / lowest.count ? current : lowest)
    : null;
  const average = completed.length
    ? Math.round(completed.reduce((sum, session) => sum + (session.scorePercent ?? 0), 0) / completed.length)
    : null;
  const latestSubject = completed[0]?.subject?.name ?? null;

  return { completed, average, weakest, latestSubject };
}

export function DashboardPage() {
  const {
    auth,
    user,
    roles,
    status,
    summary,
    summaryError,
    practiceSessions,
    practiceSessionsError,
    isWorkspaceLoading,
  } = useDashboardSummary();
  const activeSession = practiceSessions.find((session) => session.status === "active");
  const { completed, average, weakest, latestSubject } = getStudyInsight(practiceSessions);
  const recentCompleted = completed.slice(0, 3);
  const practiceSessionsCount = summary?.practiceSessionsCount ?? 0;
  const isNewWorkspace =
    !isWorkspaceLoading &&
    practiceSessions.length === 0 &&
    (summary?.papersCount ?? 0) === 0;
  const focusTitle = activeSession
    ? activeSession.title || "Your practice session is ready."
    : weakest
      ? `Strengthen ${weakest.label} next.`
      : "Your next focused session starts here.";
  const focusDescription = activeSession
    ? `${activeSession.totalQuestions} questions are waiting. Pick up at the exact point where you paused.`
    : weakest
      ? "It has your lowest average across completed subjects. A short practice is the fastest way to strengthen it."
      : "Select a grade and subject, then work through a short set without the noise of a full paper.";
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-7 pb-4">
      {summaryError ? <Notice tone="error">{summaryError}</Notice> : null}
      {practiceSessionsError ? <Notice tone="error">{practiceSessionsError}</Notice> : null}

      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#202321] text-white shadow-[0_28px_70px_-42px_rgba(32,35,33,0.5)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(215,111,85,0.34),transparent_29%),radial-gradient(circle_at_14%_110%,rgba(127,169,157,0.22),transparent_38%)]" />
        <div className="pointer-events-none absolute -right-16 bottom-[-8rem] h-80 w-80 rounded-full border border-white/10" />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />Learner workspace</div>
            <span className="rounded-full border border-white/10 bg-slate-950/20 px-3 py-1.5 text-xs font-medium text-[#d8d4c9]">Open access</span>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(270px,0.55fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="ui-kicker flex items-center gap-2 text-[#c8f27a]"><Sparkles className="h-4 w-4" /> Today’s study brief</p>
            <h1 className="mt-4 text-[clamp(2.25rem,4.6vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.055em] text-white">{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.25rem,2.3vw,1.75rem)] font-semibold leading-snug tracking-[-0.025em] text-[#e7efe9]">{focusTitle}</h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-7 text-[#d8d4c9]">{focusDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {activeSession ? (
                <Button asChild className="h-11 rounded-xl bg-[#fffdf8] px-5 text-[#202321] shadow-lg shadow-black/10 hover:bg-[#e7efe9]"><Link to="/practice/$sessionId" params={{ sessionId: activeSession.id }}><CirclePlay className="h-4 w-4" /> Continue practice</Link></Button>
              ) : (
                <Button asChild className="h-11 rounded-xl bg-[#fffdf8] px-5 text-[#202321] shadow-lg shadow-black/10 hover:bg-[#e7efe9]"><Link to="/practice">Start focused practice <ArrowRight className="h-4 w-4" /></Link></Button>
              )}
              <Button asChild variant="outline" className="h-11 rounded-xl border-white/15 bg-white/8 px-5 text-white hover:bg-white/15 hover:text-white"><Link to="/question-papers/new"><Plus className="h-4 w-4" /> Build a paper</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/12 shadow-2xl shadow-slate-950/20">
            <HeroMetric value={isWorkspaceLoading ? "—" : String(completed.length)} label="completed" />
            <HeroMetric value={isWorkspaceLoading || average == null ? "—" : `${average}%`} label="average" />
            <HeroMetric value={isWorkspaceLoading ? "—" : String(summary?.publishedQuestionCount ?? 0)} label="in bank" />
          </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.28fr)_minmax(280px,0.72fr)]">
        <div className="rounded-2xl border border-[#d8d4c9] bg-[#fffdf8] p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.36)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="ui-kicker text-[#48766b]">Choose your lane</p><h2 className="mt-2 text-xl font-bold tracking-tight text-[#202321]">One clear purpose for every study mode.</h2></div><Target className="h-5 w-5 text-[#d76f55]" /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ActionTile icon={BookOpenCheck} title="Practice deliberately" description="Choose class and subject first. Use a short set to find the gaps worth fixing." to="/practice" action="Build a session" />
            <ActionTile icon={FileText} title="Create an assessment" description="Turn the same bank into an organised draft you can review and export." to="/question-papers/new" action="Open paper studio" />
          </div>
        </div>
        <section className="rounded-2xl border border-[#c9dcd3] bg-[#e7efe9]/80 p-5 sm:p-6"><p className="ui-kicker text-[#48766b]">Your study signal</p><h2 className="mt-2 text-xl font-bold tracking-tight text-[#202321]">{weakest ? `${weakest.label} needs another pass.` : latestSubject ? `Keep building on ${latestSubject}.` : "Your feedback loop starts with one session."}</h2><p className="mt-3 text-sm leading-6 text-[#6e706b]">{weakest ? "A fresh, focused attempt is more useful than trying to cover everything at once." : latestSubject ? "You have a baseline now. Repeat this focus or choose another subject to make the comparison more useful." : "Finish a session and the most useful next focus will appear here."}</p><Link to="/practice" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#48766b] transition hover:gap-2.5 hover:text-[#2b554d]">Choose a subject <ArrowRight className="h-4 w-4" /></Link></section>
      </section>

      {isNewWorkspace ? (
        <section className="overflow-hidden rounded-2xl border border-[#d8d4c9] bg-[#fffdf8] shadow-[0_20px_52px_-42px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-5 border-b border-[#e8e2d7] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
            <div>
              <p className="ui-kicker text-[#48766b]">Your first 10 minutes</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-[#202321]">Start with one focused result—not every feature.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e706b]">This is the shortest path from a new account to a useful study signal.</p>
            </div>
            <span className="w-fit rounded-full bg-[#e7efe9] px-3 py-1.5 text-xs font-bold text-[#48766b]">Guided start</span>
          </div>
          <div className="grid divide-y divide-[#e8e2d7] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <OnboardingStep number="01" title="Set your focus" description="Choose the class and subject you are studying today." action="Choose a subject" to="/practice" />
            <OnboardingStep number="02" title="Finish a short practice" description="Begin with 5–10 questions. Your first result creates a baseline." action="Start practice" to="/practice" />
            <OnboardingStep number="03" title="Build only when needed" description="Use Paper Studio when you need a reviewable printable assessment." action="Open Paper Studio" to="/question-papers/new" />
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard title="Recent practice" description="The sessions you completed most recently." actions={<Button asChild variant="outline"><Link to="/practice">All practice</Link></Button>}>
          {isWorkspaceLoading ? (
            <DashboardListSkeleton />
          ) : recentCompleted.length ? (
            <div className="divide-y divide-[#e8e2d7]">
              {recentCompleted.map((session) => (
                <Link key={session.id} to="/practice/$sessionId" params={{ sessionId: session.id }} className="group flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#202321] transition group-hover:text-[#48766b]">{session.title || "Practice session"}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6e706b]">{scopeLabel(session)} · {session.totalQuestions} questions · {formatDate(session.completedAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-right text-base font-extrabold text-[#202321]">{session.scorePercent ?? 0}%<span className="mt-0.5 block text-xs font-medium text-[#9a9d96]">{session.correctAnswers}/{session.totalQuestions} correct</span></p>
                    <ArrowRight className="h-4 w-4 text-[#d8d4c9] transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-3"><p className="text-base font-semibold text-slate-900">No completed practice yet.</p><p className="mt-2 max-w-lg text-sm leading-6 text-[#6e706b]">Start with one grade and subject. Your result will be saved here once you finish.</p><Button asChild className="mt-5"><Link to="/practice">Start practice <ArrowRight className="h-4 w-4" /></Link></Button></div>
          )}
        </SectionCard>

        <SectionCard title="Workspace at a glance" description="Useful limits and account information—kept out of your way.">
          <div className="space-y-2">
            <StatusRow label="Practice sessions" value={isWorkspaceLoading ? "—" : String(practiceSessionsCount)} />
            <StatusRow label="Paper drafts" value={isWorkspaceLoading ? "—" : String(summary?.papersCount ?? 0)} />
            <StatusRow label="PDF exports" value={isWorkspaceLoading ? "—" : "No monthly cap"} />
            <StatusRow label="Access" value="Open access" />
            {roles.length > 0 ? <StatusRow label="Account access" value={roles.join(", ")} /> : null}
            {auth?.session?.expiresAt ? <StatusRow label="Account status" value={status} /> : null}
          </div>
          <div className="mt-5 border-t border-[#e8e2d7] pt-4 text-sm font-semibold text-[#6e706b]"><span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#d76f55]" /> Study consistently, not endlessly.</span></div>
        </SectionCard>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 bg-slate-950/35 px-4 py-5 backdrop-blur-sm"><p className="truncate text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">{value}</p><p className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.13em] text-[#c8f27a]">{label}</p></div>;
}

function ActionTile({ icon: Icon, title, description, to, action }: { icon: typeof BookOpenCheck; title: string; description: string; to: "/practice" | "/question-papers/new"; action: string }) {
  return <Link to={to} className="group rounded-xl border border-slate-200 bg-[#f8f5ee] p-4 transition hover:-translate-y-0.5 hover:border-[#7fa99d] hover:bg-white hover:shadow-[0_16px_30px_-26px_rgba(15,23,42,0.38)]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#48766b] shadow-sm ring-1 ring-[#d8d4c9]"><Icon className="h-[18px] w-[18px]" /></span><h3 className="mt-4 text-[1rem] font-bold leading-6 text-[#202321]">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#6e706b]">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#48766b]">{action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span></Link>;
}

function OnboardingStep({
  number,
  title,
  description,
  action,
  to,
}: {
  number: string;
  title: string;
  description: string;
  action: string;
  to: "/practice" | "/question-papers/new";
}) {
  return (
    <div className="relative p-5 sm:p-6">
      <span className="text-xs font-extrabold tracking-[0.16em] text-[#d76f55]">{number}</span>
      <h3 className="mt-4 text-base font-bold text-[#202321]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6e706b]">{description}</p>
      <Link to={to} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#48766b] transition hover:gap-2.5 hover:text-[#2b554d]">
        {action} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function DashboardListSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading recent practice">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center justify-between gap-5 border-b border-[#e8e2d7] pb-4 last:border-b-0 last:pb-0">
          <div className="space-y-2"><div className="h-4 w-40 skeleton-surface rounded" /><div className="h-3 w-56 skeleton-surface rounded" /></div>
          <div className="h-8 w-12 skeleton-surface rounded" />
        </div>
      ))}
    </div>
  );
}
