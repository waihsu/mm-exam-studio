import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";

export function OpenAccessPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="MM Exam Studio"
        title="Open access, built for study."
        description="This self-hostable edition does not require a subscription or payment to use its core study and paper tools."
        actions={
          <Button asChild>
            <Link to="/practice">
              Start practice <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <AccessCard
          icon={BookOpenCheck}
          title="Practice without tiers"
          description="Choose a class and subject, then build the study session that matches your goal."
          action="Open practice"
          to="/practice"
        />
        <AccessCard
          icon={FileText}
          title="Create and export papers"
          description="Use the paper workspace, branding, review, and PDF export without monthly caps."
          action="Open Paper Studio"
          to="/question-papers/new"
        />
        <AccessCard
          icon={HeartHandshake}
          title="Improve it together"
          description="MM Exam Studio is MIT licensed. You can inspect, adapt, and self-host the source for your learning community."
          action="Contact support"
          to="/support"
        />
      </div>
      <SectionCard
        title="A note on open source"
        description="Open access removes commercial feature gates; it does not replace responsible hosting, account security, or content review."
      >
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-slate-700">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          Keep backups, configure email and security secrets, and review academic content before sharing it with learners.
        </div>
      </SectionCard>
    </div>
  );
}

function AccessCard({
  icon: Icon,
  title,
  description,
  action,
  to,
}: {
  icon: typeof BookOpenCheck;
  title: string;
  description: string;
  action: string;
  to: "/practice" | "/question-papers/new" | "/support";
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.36)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 transition hover:gap-2.5 hover:text-indigo-950"
      >
        {action} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
