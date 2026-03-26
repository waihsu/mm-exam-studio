import { useMemo, useState } from "react";
import {
  Headphones,
  LifeBuoy,
  Lock,
  MessageSquareMore,
  RefreshCcw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { useCreateSupportMessageMutation } from "../hooks/use-create-support-message-mutation";
import { useMySupportConversationQuery } from "../hooks/use-my-support-conversation-query";

const SUPPORT_PRESETS = [
  {
    label: "Plan upgrade",
    subject: "Subscription upgrade help",
    body: "I need help with plan upgrade, payment proof, or approval status.",
  },
  {
    label: "Paper export",
    subject: "Paper export help",
    body: "I need help with paper generation, PDF export, or print output.",
  },
  {
    label: "Account issue",
    subject: "Account and sign-in help",
    body: "I need help with sign-in, sessions, or account access.",
  },
] as const;

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("en-US") : "No activity yet";

const statusChipClassName = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

const messageBubbleClassName = {
  user: "ml-auto border-indigo-200 bg-indigo-600 text-white",
  admin: "mr-auto border-slate-200 bg-slate-50 text-slate-900",
} as const;

export function SupportPage() {
  const conversationQuery = useMySupportConversationQuery();
  const createMessageMutation = useCreateSupportMessageMutation();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const conversation = conversationQuery.data?.conversation ?? null;
  const messages = conversationQuery.data?.messages ?? [];
  const canReply = conversation?.allowUserReplies ?? true;
  const resolvedSubject = conversation?.subject ?? subject;
  const trimmedBody = body.trim();
  const isSendingDisabled =
    createMessageMutation.isPending || !canReply || trimmedBody.length === 0;

  const latestAdminMessage = useMemo(
    () => [...messages].reverse().find((message) => message.senderRole === "admin") ?? null,
    [messages],
  );

  const applyPreset = (preset: (typeof SUPPORT_PRESETS)[number]) => {
    if (!conversation?.subject) {
      setSubject(preset.subject);
    }
    if (!body.trim()) {
      setBody(preset.body);
    }
  };

  const submitMessage = async () => {
    const nextBody = body.trim();
    const nextSubject = resolvedSubject.trim();
    if (!nextBody) {
      return;
    }

    await createMessageMutation.mutateAsync({
      body: nextBody,
      subject: nextSubject || undefined,
    });
    setBody("");
    if (!conversation?.subject && nextSubject) {
      setSubject(nextSubject);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Support"
        title="Help and conversation"
        description="Keep one support thread for account, subscription, and paper issues without leaving the workspace."
        chips={
          <>
            <span className={cn("app-chip border", statusChipClassName[conversation?.status ?? "open"])}>
              {conversation?.status === "closed" ? "Thread closed" : "Thread open"}
            </span>
            <span className="app-chip">
              {canReply ? "Replies enabled" : "Replies paused"}
            </span>
            <span className="app-chip">{messages.length} messages</span>
          </>
        }
        actions={
          <Button
            variant="outline"
            className="bg-white"
            onClick={() => {
              void conversationQuery.refetch();
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {conversationQuery.isError ? (
        <Notice tone="error">
          {conversationQuery.error instanceof Error
            ? conversationQuery.error.message
            : "Failed to load support conversation."}
        </Notice>
      ) : null}

      {createMessageMutation.isError ? (
        <Notice tone="error">
          {createMessageMutation.error instanceof Error
            ? createMessageMutation.error.message
            : "Failed to send support message."}
        </Notice>
      ) : null}

      <StatGrid className="xl:grid-cols-3">
        <SectionCard
          title="Thread status"
          description="One shared thread follows your account."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Last update
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatDateTime(conversation?.lastMessageAt)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Topic
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {resolvedSubject || "General support"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Latest admin reply"
          description="Most recent response from support."
        >
          {latestAdminMessage ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">
                {latestAdminMessage.senderName || "Support"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {latestAdminMessage.body}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {formatDateTime(latestAdminMessage.createdAt)}
              </p>
            </div>
          ) : (
            <EmptyState
              title="No admin reply yet"
              description="Your first message starts the thread."
              icon={Headphones}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Quick starters"
          description="Use one to prefill the composer faster."
        >
          <div className="grid gap-2">
            {SUPPORT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-900 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-900">{preset.label}</p>
                <p className="mt-1 text-sm text-slate-500">{preset.subject}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </StatGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <SectionCard
          title="Conversation"
          description="This thread refreshes automatically while you work."
        >
          <div className="mt-4 space-y-3">
            {conversationQuery.isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                title="No messages yet"
                description="Send the first message and support replies will appear here."
                icon={MessageSquareMore}
              />
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "max-w-[88%] rounded-2xl border px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)]",
                      messageBubbleClassName[message.senderRole],
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          message.senderRole === "user" ? "text-white" : "text-slate-900",
                        )}
                      >
                        {message.senderRole === "user"
                          ? "You"
                          : message.senderName || "Support"}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          message.senderRole === "user" ? "text-indigo-100" : "text-slate-500",
                        )}
                      >
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "mt-2 whitespace-pre-wrap text-sm leading-6",
                        message.senderRole === "user" ? "text-indigo-50" : "text-slate-700",
                      )}
                    >
                      {message.body}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Send a message"
          description="Keep each message clear so admin can resolve it faster."
        >
          <div className="space-y-4">
            {!canReply ? (
              <Notice tone="warning">
                Admin has paused replies for this thread. Wait for the thread to reopen.
              </Notice>
            ) : null}

            {!conversation?.subject ? (
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Subject
                </span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Briefly describe the issue"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Subject
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {conversation.subject}
                </p>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Message
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Describe the issue, what you expected, and what happened."
                rows={8}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-slate-900"
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                {canReply ? (
                  <LifeBuoy className="h-4 w-4 text-slate-500" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-500" />
                )}
                <p>
                  {canReply
                    ? "This thread auto-refreshes every 15 seconds."
                    : "Replies are currently paused by admin for this thread."}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={isSendingDisabled}
              onClick={() => {
                void submitMessage();
              }}
            >
              <Send className="h-4 w-4" />
              {createMessageMutation.isPending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
