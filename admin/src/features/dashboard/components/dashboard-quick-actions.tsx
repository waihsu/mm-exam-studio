import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookText,
  FileText,
  LifeBuoy,
  Settings,
} from "lucide-react";
import { PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";

const quickActions = [
  {
    title: "Question bank",
    detail: "Review, publish, and clean up the core bank.",
    to: ADMIN_ROUTES.questions,
    icon: BookText,
  },
  {
    title: "Support inbox",
    detail: "Reply to user threads without leaving admin operations.",
    to: ADMIN_ROUTES.userSupport,
    icon: LifeBuoy,
  },
] as const;

export function DashboardQuickActions() {
  const studyAppUrl = (
    import.meta.env.VITE_STUDY_APP_URL ?? "http://localhost:5173"
  )
    .trim()
    .replace(/\/+$/, "");

  return (
    <PagePanel className="space-y-4">
      <div>
        <p className="admin-kicker text-slate-500">Quick actions</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Jump into work
        </h2>
      </div>

      <div className="space-y-3">
        {quickActions.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex min-w-0 gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          );
        })}

        <a
          href={`${studyAppUrl}/question-papers/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex min-w-0 gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Create a paper
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Assemble a printable draft from the published question bank.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        </a>

        <Link
          to={ADMIN_ROUTES.settingsSecurity}
          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
        >
          <div className="flex min-w-0 gap-3">
            <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Security settings
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review sessions, audit logs, and auth controls.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      </div>
    </PagePanel>
  );
}
