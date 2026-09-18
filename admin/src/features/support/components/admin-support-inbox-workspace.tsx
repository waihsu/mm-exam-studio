import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Messenger } from "@/components/uitripled/messenger";
import { PagePanel } from "@/components/page-container";
import type { AdminSupportConversation } from "../types";

type MessengerConversation = ComponentProps<typeof Messenger>["conversations"][number];

type AdminSupportInboxWorkspaceProps = {
  conversations: MessengerConversation[];
  selectedConversationId: string | null;
  selectedConversation: AdminSupportConversation | null;
  realtimeStatus: "connecting" | "live" | "offline";
  realtimeError: string | null;
  conversationsError: Error | null;
  detailError: Error | null;
  replyError: Error | null;
  draft: string;
  sending: boolean;
  updatingStatus: boolean;
  threadLoading: boolean;
  onSelectConversation: (conversationId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filterStatus: "all" | "open" | "closed";
  onFilterStatusChange: (status: "all" | "open" | "closed") => void;
  onToggleConversationStatus: () => void;
  onToggleUserReplies: () => void;
  onDraftChange: (value: string) => void;
  onSubmitReply: () => void;
  onQuickReply: (value: string) => void;
};

export function AdminSupportInboxWorkspace({
  conversations,
  selectedConversationId,
  selectedConversation,
  realtimeStatus,
  realtimeError,
  conversationsError,
  detailError,
  replyError,
  draft,
  sending,
  updatingStatus,
  threadLoading,
  onSelectConversation,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filterStatus,
  onFilterStatusChange,
  onToggleConversationStatus,
  onToggleUserReplies,
  onDraftChange,
  onSubmitReply,
  onQuickReply,
}: AdminSupportInboxWorkspaceProps) {
  return (
    <Messenger
      title="Support Inbox"
      liveLabel={realtimeStatus === "live" ? "Live" : "Offline"}
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      onSelectConversation={onSelectConversation}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder="Search name, email, subject..."
      sidebarControls={
        <>
          <div className="flex flex-wrap gap-2">
            {(["open", "closed", "all"] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => onFilterStatusChange(status)}
              >
                {status[0]?.toUpperCase()}{status.slice(1)}
              </Button>
            ))}
          </div>
          {conversationsError ? (
            <ErrorNotice>{conversationsError.message}</ErrorNotice>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {realtimeError
              ? realtimeError
              : realtimeStatus === "live"
                ? "Realtime sync is active."
                : "Realtime sync is offline. The inbox still works with normal fetch requests."}
          </div>
        </>
      }
      headerMeta={
        selectedConversation ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Last activity {formatDateTime(selectedConversation.lastMessageAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              User replies {selectedConversation.allowUserReplies ? "enabled" : "blocked"}
            </p>
          </div>
        ) : null
      }
      headerActions={
        selectedConversation ? (
          <>
            <Button type="button" variant="outline" disabled={updatingStatus} onClick={onToggleConversationStatus}>
              {selectedConversation.status === "open" ? "Close thread" : "Reopen thread"}
            </Button>
            <Button type="button" variant="outline" disabled={updatingStatus} onClick={onToggleUserReplies}>
              {selectedConversation.allowUserReplies ? "Block replies" : "Allow replies"}
            </Button>
          </>
        ) : null
      }
      threadNotice={
        selectedConversation ? (
          <div className="space-y-2">
            {!selectedConversation.allowUserReplies ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                User can still read this thread, but new user messages are currently blocked by admin.
              </div>
            ) : null}
            {detailError ? <ErrorNotice>{detailError.message}</ErrorNotice> : null}
            {replyError ? <ErrorNotice>{replyError.message}</ErrorNotice> : null}
          </div>
        ) : null
      }
      draft={draft}
      onDraftChange={onDraftChange}
      onSubmit={onSubmitReply}
      submitDisabled={sending || !draft.trim() || !selectedConversationId}
      submitLabel={sending ? "Sending..." : "Send Reply"}
      composerHint={
        selectedConversation
          ? `Replying to ${selectedConversation.user?.name ?? "user"}`
          : "Select a conversation first"
      }
      onQuickReply={onQuickReply}
      isThreadLoading={threadLoading}
      emptyThread={
        <PagePanel className="border-dashed bg-white p-4 text-sm text-slate-500 shadow-none">
          No messages in this conversation yet.
        </PagePanel>
      }
      emptySelection={
        <div className="flex min-h-[720px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
          Select a support conversation to review the full chat thread.
        </div>
      }
    />
  );
}

function ErrorNotice({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      {children}
    </div>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "No activity";
}
