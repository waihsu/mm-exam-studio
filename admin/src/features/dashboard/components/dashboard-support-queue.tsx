import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";
import type { AdminSupportConversation } from "@/features/support/types";

type DashboardSupportQueueProps = {
  conversations: AdminSupportConversation[];
  total: number;
  waitingBadgeClassName: string;
};

export function DashboardSupportQueue({
  conversations,
  total,
  waitingBadgeClassName,
}: DashboardSupportQueueProps) {
  return (
    <PagePanel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="admin-kicker text-slate-500">Needs attention</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Review queues</h2>
        </div>
        <Badge className={waitingBadgeClassName}>{conversations.length} waiting now</Badge>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Support inbox</h3>
            <p className="text-sm text-slate-600">Open conversations waiting for admin replies.</p>
          </div>
          <Badge className={waitingBadgeClassName}>{total}</Badge>
        </div>

        <div className="space-y-2">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={ADMIN_ROUTES.userSupport}
                search={{ conversationId: conversation.id }}
                className="block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {conversation.user?.name || conversation.user?.email || "Unknown user"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {conversation.subject || "Support thread"}
                    </p>
                  </div>
                  <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                    {conversation.unreadForAdminCount} unread
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                  {conversation.lastMessagePreview || "No preview available"}
                </p>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-800">
              No open support threads are waiting right now.
            </p>
          )}
        </div>
      </div>
    </PagePanel>
  );
}
