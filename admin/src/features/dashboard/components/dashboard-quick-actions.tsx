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
        <p className="admin-kicker text-[#48766b]">Quick actions</p>
        <h2 className="text-2xl font-bold tracking-tight text-[#202321]">
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
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#d8d4c9] bg-[#fffdf8] px-4 py-4 transition hover:border-[#7fa99d] hover:bg-[#f8f5ee]"
            >
              <div className="flex min-w-0 gap-3">
                <div className="rounded-2xl bg-[#202321] p-3 text-[#c8f27a]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#202321]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6e706b]">
                    {item.detail}
                  </p>
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9a9d96]" />
            </Link>
          );
        })}

        <a
          href={`${studyAppUrl}/question-papers/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-3 rounded-2xl border border-[#d8d4c9] bg-[#fffdf8] px-4 py-4 transition hover:border-[#7fa99d] hover:bg-[#f8f5ee]"
        >
          <div className="flex min-w-0 gap-3">
            <div className="rounded-2xl bg-[#202321] p-3 text-[#c8f27a]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#202321]">
                Create a paper
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6e706b]">
                Assemble a printable draft from the published question bank.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9a9d96]" />
        </a>

        <Link
          to={ADMIN_ROUTES.settingsSecurity}
          className="flex items-start justify-between gap-3 rounded-2xl border border-[#d8d4c9] bg-[#f8f5ee] px-4 py-4 transition hover:border-[#7fa99d] hover:bg-[#fffdf8]"
        >
          <div className="flex min-w-0 gap-3">
            <div className="rounded-2xl bg-[#fffdf8] p-3 text-[#48766b] shadow-sm">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#202321]">
                Security settings
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6e706b]">
                Review sessions, audit logs, and auth controls.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9a9d96]" />
        </Link>
      </div>
    </PagePanel>
  );
}
