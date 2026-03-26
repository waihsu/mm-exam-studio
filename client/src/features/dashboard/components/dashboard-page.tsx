import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileOutput, FileText, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { getPlanCatalogItem } from "@/features/subscription/subscription-catalog";
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
    label: "Plans",
    description: "Compare tiers and request upgrades",
  },
] as const;

export function DashboardPage() {
  const { auth, user, roles, status, summary, latestRequest, summaryError } = useDashboardSummary();
  const planCatalog = getPlanCatalogItem(summary?.subscription.code ?? "free");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}.`}
        description="Practice, generate papers, and track usage."
        chips={
          <>
            <BadgePill label="Plan" value={summary?.subscription.name ?? "Free"} />
            <BadgePill label="Status" value={status} />
            {latestRequest ? (
              <BadgePill label="Request" value={latestRequest.status.replace("_", " ")} />
            ) : null}
          </>
        }
        actions={
          <>
            <Button asChild>
              <Link to="/practice">
                Start practice
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <Link to="/question-papers/new">New paper</Link>
            </Button>
          </>
        }
      />

      {summaryError ? (
        <Notice tone="error">
          {summaryError}
        </Notice>
      ) : null}

      <StatGrid>
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
      </StatGrid>

      <div className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard
          title="Quick actions"
          actions={<QuickPill label="Completed" value={String(summary?.completedPracticeCount ?? 0)} />}
        >
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
        </SectionCard>

        <SectionCard
          title="Plan snapshot"
          description={planCatalog.tagline}
          actions={
            <Button asChild variant="outline" className="bg-white">
              <Link to="/subscription">Compare plans</Link>
            </Button>
          }
        >
          <div className="mt-4 space-y-3">
            <StatusRow label="Signed in" value={user?.email || "Unknown"} />
            <StatusRow label="Plan" value={summary?.subscription.name ?? "Free"} />
            <StatusRow label="Practice limit" value={planCatalog.limitSummary.practice} />
            <StatusRow label="Paper limit" value={planCatalog.limitSummary.paper} />
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
        </SectionCard>
      </div>
    </div>
  );
}
