import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileOutput, FileText, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { BadgePill, MetricCard, QuickPill, StatusRow } from "./dashboard-shared";

const DASHBOARD_ACTIONS = [
  {
    to: "/practice",
    label: "Practice",
    description: "Start or continue a session",
  },
  {
    to: "/question-papers/new",
    label: "New paper",
    description: "Create a printable draft",
  },
  {
    to: "/question-papers",
    label: "Papers",
    description: "Manage drafts and exports",
  },
  {
    to: "/subscription",
    label: "Usage",
    description: "Review current workspace counts",
  },
] as const;

export function DashboardPage() {
  const { auth, user, roles, status, summary, latestRequest, summaryError } = useDashboardSummary();

  return (
    <div className="space-y-4">
      <section className="app-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Dashboard
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Practice, generate papers, and track usage.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <BadgePill label="Plan" value={summary?.subscription.name ?? "Free"} />
              <BadgePill label="Status" value={status} />
              {latestRequest ? (
                <BadgePill label="Request" value={latestRequest.status.replace("_", " ")} />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/practice">
                Start practice
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <Link to="/question-papers/new">New paper</Link>
            </Button>
          </div>
        </div>
      </section>

      {summaryError ? (
        <Notice tone="error">
          {summaryError}
        </Notice>
      ) : null}

      <div className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Questions"
          value={String(summary?.publishedQuestionCount ?? 0)}
        />
        <MetricCard
          icon={LockKeyhole}
          label="Practice"
          value={String(summary?.practiceSessionsCount ?? 0)}
        />
        <MetricCard
          icon={FileText}
          label="Papers"
          value={String(summary?.papersCount ?? 0)}
        />
        <MetricCard
          icon={FileOutput}
          label="Exports"
          value={String(summary?.exportedPapersCount ?? 0)}
        />
      </div>

      <div className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Quick actions</h3>
            <QuickPill label="Completed" value={String(summary?.completedPracticeCount ?? 0)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DASHBOARD_ACTIONS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group hover-lift rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-slate-400 transition group-hover:text-slate-800" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">Workspace status</h3>
          <div className="mt-4 space-y-3">
            <StatusRow label="Signed in" value={user?.email || "Unknown"} />
            <StatusRow label="Plan" value={summary?.subscription.name ?? "Free"} />
            <StatusRow
              label="PDF remaining"
              value={
                summary?.subscription.remaining.pdfExports == null
                  ? "Plan cap"
                  : String(summary.subscription.remaining.pdfExports)
              }
            />
            <StatusRow
              label="Device limit"
              value={String(summary?.subscription.limits.deviceLimit ?? 1)}
            />
            <StatusRow label="Session" value={auth?.session?.expiresAt ? "Active" : "Unknown"} />
            {roles.length > 0 ? <StatusRow label="Roles" value={roles.join(", ")} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
