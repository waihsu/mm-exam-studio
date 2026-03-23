"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCheck, Search, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type MessengerMessage = {
  id: string;
  sender: "self" | "other";
  author: string;
  text: string;
  timestamp: string;
};

export type MessengerConversation = {
  id: string;
  name: string;
  title: string;
  subtitle?: string | null;
  status: "online" | "offline";
  unread: number;
  initials: string;
  preview?: string | null;
  messages: MessengerMessage[];
  quickReplies?: string[];
};

type MessengerProps = {
  title?: string;
  liveLabel?: string;
  conversations: MessengerConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  sidebarControls?: ReactNode;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  threadNotice?: ReactNode;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  composerHint?: ReactNode;
  quickReplyLabel?: string;
  onQuickReply?: (value: string) => void;
  isThreadLoading?: boolean;
  emptyThread?: ReactNode;
  emptySelection?: ReactNode;
};

const statusDotColor: Record<MessengerConversation["status"], string> = {
  online: "bg-green-500",
  offline: "bg-slate-400",
};

export function Messenger({
  title = "Messenger",
  liveLabel = "Live",
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search conversations",
  sidebarControls,
  headerMeta,
  headerActions,
  threadNotice,
  draft,
  onDraftChange,
  onSubmit,
  submitDisabled,
  submitLabel = "Send",
  composerHint,
  quickReplyLabel = "Quick replies",
  onQuickReply,
  isThreadLoading = false,
  emptyThread,
  emptySelection,
}: MessengerProps) {
  const shouldReduceMotion = useReducedMotion();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (!messagesContainerRef.current || !activeConversation) {
      return;
    }

    const container = messagesContainerRef.current;
    const behavior = shouldReduceMotion ? "auto" : "smooth";
    const scrollToBottom = () => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    };

    if (behavior === "smooth") {
      requestAnimationFrame(scrollToBottom);
      return;
    }

    scrollToBottom();
  }, [activeConversation, shouldReduceMotion]);

  useEffect(() => {
    if (!liveRegionRef.current || !activeConversation) {
      return;
    }

    const lastMessage =
      activeConversation.messages[activeConversation.messages.length - 1];
    if (!lastMessage) {
      return;
    }

    liveRegionRef.current.textContent = `${lastMessage.author} at ${lastMessage.timestamp}: ${lastMessage.text}`;
  }, [activeConversation]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitDisabled) {
      return;
    }
    onSubmit();
  };

  return (
    <section className="relative w-full">
      <div className="relative grid min-h-[720px] gap-6 overflow-hidden rounded-[30px] border border-border/50 bg-background/70 p-5 backdrop-blur-xl lg:grid-cols-[340px_minmax(0,1fr)] lg:p-7">
        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-3xl border border-border/40 bg-background/75 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border border-border/50 bg-primary/15 px-3 py-1 text-[0.7rem] uppercase tracking-[0.24em] text-primary hover:bg-primary/15 hover:text-primary"
            >
              {liveLabel}
            </Badge>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit?.();
            }}
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
                aria-hidden="true"
              />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                type="search"
                placeholder={searchPlaceholder}
                className="w-full rounded-2xl border-border/40 bg-background/60 pl-10 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            {onSearchSubmit ? (
              <Button type="submit" variant="outline" className="rounded-2xl">
                Search
              </Button>
            ) : null}
          </form>

          {sidebarControls ? <div className="space-y-3">{sidebarControls}</div> : null}

          <div
            className="flex-1 space-y-2 overflow-y-auto pr-1"
            aria-label="Conversation list"
            role="list"
          >
            {conversations.length ? (
              conversations.map((conversation) => {
                const isActive = conversation.id === selectedConversationId;
                return (
                  <motion.button
                    key={conversation.id}
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "group relative flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "border-primary/40 bg-primary/10"
                        : "bg-background/70 hover:border-border/40 hover:bg-muted/40",
                    )}
                    role="listitem"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 rounded-2xl border border-border/40 bg-background/80 text-foreground">
                        <AvatarFallback className="rounded-2xl bg-primary/15 text-sm font-medium text-primary">
                          {conversation.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 inline-flex h-3 w-3 rounded-full border-2 border-background",
                          statusDotColor[conversation.status],
                        )}
                        aria-label={conversation.status === "online" ? "Online" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {conversation.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conversation.title}
                          </p>
                          {conversation.subtitle ? (
                            <p className="truncate text-[11px] text-muted-foreground/80">
                              {conversation.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {conversation.preview ?? "No messages yet"}
                      </p>
                    </div>

                    {conversation.unread > 0 ? (
                      <span className="ml-2 inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground shadow-lg">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </motion.button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                No conversations matched the current filters.
              </div>
            )}
          </div>
        </aside>

        <div className="min-h-0">
          {activeConversation ? (
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={activeConversation.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex h-full min-h-[720px] flex-col gap-5 overflow-hidden rounded-3xl border border-border/40 bg-background/80 p-5 backdrop-blur"
              >
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 rounded-3xl border border-border/40 bg-card/80 text-foreground">
                        <AvatarFallback className="rounded-3xl bg-primary/20 text-base font-semibold text-primary">
                          {activeConversation.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 inline-flex h-3.5 w-3.5 rounded-full border-2 border-background",
                          statusDotColor[activeConversation.status],
                        )}
                        aria-label={activeConversation.status === "online" ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {activeConversation.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activeConversation.title}
                      </p>
                      {activeConversation.subtitle ? (
                        <p className="text-xs text-muted-foreground/80">
                          {activeConversation.subtitle}
                        </p>
                      ) : null}
                      {headerMeta}
                    </div>
                  </div>
                  {headerActions ? (
                    <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
                  ) : null}
                </header>

                {threadNotice}

                <div
                  ref={messagesContainerRef}
                  className="relative flex-1 min-h-0 space-y-4 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted"
                  aria-live="off"
                  aria-label={`Message thread with ${activeConversation.name}`}
                >
                  {isThreadLoading ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                      Loading conversation...
                    </div>
                  ) : activeConversation.messages.length ? (
                    <AnimatePresence initial={false}>
                      {activeConversation.messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={
                            shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }
                          }
                          animate={
                            shouldReduceMotion
                              ? { opacity: 1 }
                              : { opacity: 1, y: 0, scale: 1 }
                          }
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="flex flex-col gap-1"
                          role="group"
                          aria-label={`${message.author} at ${message.timestamp}`}
                        >
                          <div
                            className={cn(
                              "relative max-w-[82%] rounded-2xl border border-border/40 bg-background/80 px-4 py-3 text-sm leading-relaxed text-foreground backdrop-blur",
                              message.sender === "self" &&
                                "ml-auto border-primary/40 bg-primary text-primary-foreground",
                            )}
                          >
                            <p className="font-medium text-foreground/80">
                              {message.author}
                            </p>
                            <p
                              className={cn(
                                "mt-1",
                                message.sender === "self"
                                  ? "text-primary-foreground/92"
                                  : "text-foreground/90",
                              )}
                            >
                              {message.text}
                            </p>
                            <div className="mt-3 flex items-center justify-end gap-2 text-[0.7rem]">
                              <span
                                className={cn(
                                  "text-muted-foreground",
                                  message.sender === "self" && "text-primary-foreground/80",
                                )}
                              >
                                {message.timestamp}
                              </span>
                              {message.sender === "self" ? (
                                <CheckCheck
                                  className="h-3.5 w-3.5 text-primary-foreground/80"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    emptyThread ?? (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                        No messages in this conversation yet.
                      </div>
                    )
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3" aria-label="Reply composer">
                  <label htmlFor="messenger-editor" className="sr-only">
                    Write a message
                  </label>
                  <div className="rounded-3xl border border-border/40 bg-background/80 p-4 backdrop-blur">
                    <Textarea
                      id="messenger-editor"
                      value={draft}
                      onChange={(event) => onDraftChange(event.target.value)}
                      placeholder={`Message ${activeConversation.name}`}
                      rows={3}
                      className="min-h-[5rem] w-full resize-none border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-0"
                      aria-label={`Message ${activeConversation.name}`}
                    />

                    {activeConversation.quickReplies?.length ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {quickReplyLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeConversation.quickReplies.map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              onClick={() => onQuickReply?.(reply)}
                              className="rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">{composerHint}</div>
                      <Button
                        type="submit"
                        className="rounded-full px-5"
                        disabled={submitDisabled}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submitLabel}
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          ) : (
            emptySelection ?? (
              <div className="flex min-h-[720px] items-center justify-center rounded-3xl border border-dashed border-border/60 bg-background/70 p-8 text-sm text-muted-foreground">
                Select a conversation to review the full thread.
              </div>
            )
          )}
        </div>
      </div>

      <div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </section>
  );
}
