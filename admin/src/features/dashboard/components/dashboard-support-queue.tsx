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
          <p className="admin-kicker text-[#48766b]">Needs attention</p>
          <h2 className="text-2xl font-bold tracking-tight text-[#202321]">Review queues</h2>
        </div>
        <Badge className={waitingBadgeClassName}>{conversations.length} waiting now</Badge>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#d8d4c9] bg-[#f8f5ee] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#202321]">Support inbox</h3>
            <p className="text-sm text-[#6e706b]">Open conversations waiting for admin replies.</p>
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
                className="block rounded-xl border border-[#d8d4c9] bg-[#fffdf8] px-3 py-3 transition hover:border-[#7fa99d] hover:bg-[#e7efe9]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#202321]">
                      {conversation.user?.name || conversation.user?.email || "Unknown user"}
                    </p>
                    <p className="truncate text-xs text-[#6e706b]">
                      {conversation.subject || "Support thread"}
                    </p>
                  </div>
                  <Badge className="border-[#c9dcd3] bg-[#e7efe9] text-[#2b554d]">
                    {conversation.unreadForAdminCount} unread
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-[#6e706b]">
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
