import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Messenger } from "@/components/uitripled/messenger";
import { supportApi } from "@/features/support/api/support.api";
import { connectAdminSupportRealtime } from "@/features/support/realtime/support-realtime";
import type {
  AdminSupportConversation,
  AdminSupportConversationDetail,
  AdminSupportMessage,
  PaginatedAdminSupportConversationResult,
} from "@/features/support/types";

type SupportInboxSearch = {
  search?: string;
  status?: "all" | "open" | "closed";
  conversationId?: string;
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "No activity";

const compareConversationActivity = (
  left: AdminSupportConversation,
  right: AdminSupportConversation,
) =>
  new Date(right.lastMessageAt ?? right.updatedAt).getTime() -
  new Date(left.lastMessageAt ?? left.updatedAt).getTime();

const toInitials = (value: string | null | undefined) => {
  const parts = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "SU";
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

export const Route = createFileRoute("/_protected/users/support")({
  validateSearch: (search): SupportInboxSearch => ({
    search: typeof search.search === "string" ? search.search : undefined,
    status:
      search.status === "open" || search.status === "closed" || search.status === "all"
        ? search.status
        : undefined,
    conversationId:
      typeof search.conversationId === "string" ? search.conversationId : undefined,
  }),
  component: UserSupportInboxPage,
});

function UserSupportInboxPage() {
  const navigate = useNavigate();
  const routeSearch = Route.useSearch();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState(routeSearch.search ?? "");
  const [search, setSearch] = useState(routeSearch.search ?? "");
  const [status, setStatus] = useState<"all" | "open" | "closed">(
    routeSearch.status ?? "open",
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    routeSearch.conversationId ?? null,
  );
  const [replyBody, setReplyBody] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const syncConversationListCaches = (conversation: AdminSupportConversation) => {
    const cacheEntries = queryClient.getQueriesData<PaginatedAdminSupportConversationResult>({
      queryKey: ["admin-support-conversations"],
    });

    for (const [cacheKey, cached] of cacheEntries) {
      if (!cached) {
        continue;
      }

      const [, , statusFilter] = cacheKey as [
        string,
        string,
        "all" | "open" | "closed",
      ];
      const rowIndex = cached.rows.findIndex((row) => row.id === conversation.id);
      if (rowIndex === -1) {
        continue;
      }

      const matchesStatus = statusFilter === "all" || statusFilter === conversation.status;
      let nextRows = [...cached.rows];
      let nextTotal = cached.total;

      if (!matchesStatus) {
        nextRows.splice(rowIndex, 1);
        nextTotal = Math.max(0, nextTotal - 1);
      } else {
        nextRows[rowIndex] = conversation;
        nextRows = nextRows.sort(compareConversationActivity);
      }

      queryClient.setQueryData(cacheKey, {
        ...cached,
        rows: nextRows,
        total: nextTotal,
      });
    }
  };

  const restoreConversationListCaches = (
    cacheEntries: Array<[unknown, PaginatedAdminSupportConversationResult | undefined]>,
  ) => {
    for (const [cacheKey, cached] of cacheEntries) {
      queryClient.setQueryData(cacheKey as readonly unknown[], cached);
    }
  };

  const conversationsQuery = useQuery({
    queryKey: ["admin-support-conversations", search, status],
    queryFn: async () => {
      const response = await supportApi.getConversations({
        page: 1,
        pageSize: 50,
        search: search || undefined,
        status: status === "all" ? undefined : status,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  useEffect(() => {
    setSearchInput(routeSearch.search ?? "");
    setSearch(routeSearch.search ?? "");
  }, [routeSearch.search]);

  useEffect(() => {
    setStatus(routeSearch.status ?? "open");
  }, [routeSearch.status]);

  useEffect(() => {
    setSelectedConversationId(routeSearch.conversationId ?? null);
  }, [routeSearch.conversationId]);

  useEffect(() => {
    if (routeSearch.conversationId) {
      const hasRouteConversation = conversationsQuery.data?.rows.some(
        (row) => row.id === routeSearch.conversationId,
      );
      if (hasRouteConversation) {
        setSelectedConversationId(routeSearch.conversationId);
        return;
      }
    }

    const firstConversationId = conversationsQuery.data?.rows[0]?.id ?? null;

    if (!selectedConversationId && firstConversationId) {
      setSelectedConversationId(firstConversationId);
      return;
    }

    if (
      selectedConversationId &&
      conversationsQuery.data &&
      !conversationsQuery.data.rows.some((row) => row.id === selectedConversationId)
    ) {
      setSelectedConversationId(firstConversationId);
    }
  }, [conversationsQuery.data, routeSearch.conversationId, selectedConversationId]);

  const detailQuery = useQuery({
    queryKey: ["admin-support-conversation-detail", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) {
        throw new Error("No support conversation selected.");
      }

      const response = await supportApi.getConversationDetail(selectedConversationId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(selectedConversationId),
  });

  useEffect(() => {
    const cleanup = connectAdminSupportRealtime({
      search,
      status,
      selectedConversationId,
      onStatusChange: setRealtimeStatus,
      onConversationsSnapshot: (data) => {
        queryClient.setQueryData(["admin-support-conversations", search, status], data);
      },
      onConversationDetailSnapshot: (data) => {
        queryClient.setQueryData(
          ["admin-support-conversation-detail", data.conversation.id],
          data,
        );
      },
      onError: setRealtimeError,
    });

    return cleanup;
  }, [queryClient, search, selectedConversationId, status]);

  const replyMutation = useMutation({
    mutationFn: async (params: { conversationId: string; body: string; subject?: string }) => {
      const response = await supportApi.replyToConversation(params.conversationId, {
        body: params.body,
        subject: params.subject,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onMutate: async (params) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: ["admin-support-conversations"] });

      const previousDetail =
        queryClient.getQueryData<AdminSupportConversationDetail>(detailKey);
      const previousListCaches =
        queryClient.getQueriesData<PaginatedAdminSupportConversationResult>({
          queryKey: ["admin-support-conversations"],
        });

      const trimmedBody = params.body.trim();
      if (!previousDetail || trimmedBody.length === 0) {
        return { previousDetail, previousListCaches };
      }

      const optimisticCreatedAt = new Date().toISOString();
      const optimisticMessage: AdminSupportMessage = {
        id: `optimistic-admin-${Date.now()}`,
        conversationId: params.conversationId,
        senderRole: "admin",
        senderUserId: previousDetail.conversation.userId,
        senderName: "Admin",
        body: trimmedBody,
        createdAt: optimisticCreatedAt,
      };
      const optimisticDetail: AdminSupportConversationDetail = {
        conversation: {
          ...previousDetail.conversation,
          subject: params.subject?.trim() || previousDetail.conversation.subject,
          status: "open",
          lastMessagePreview: trimmedBody,
          lastMessageAt: optimisticCreatedAt,
          updatedAt: optimisticCreatedAt,
          unreadForAdminCount: 0,
          unreadForUserCount: previousDetail.conversation.unreadForUserCount + 1,
        },
        messages: [...previousDetail.messages, optimisticMessage],
      };

      queryClient.setQueryData(detailKey, optimisticDetail);
      syncConversationListCaches(optimisticDetail.conversation);

      return { previousDetail, previousListCaches };
    },
    onError: (_error, params, context) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      if (context?.previousDetail) {
        queryClient.setQueryData(detailKey, context.previousDetail);
      }
      if (context?.previousListCaches) {
        restoreConversationListCaches(context.previousListCaches);
      }
    },
    onSuccess: (data) => {
      setReplyBody("");
      queryClient.setQueryData(["admin-support-conversation-detail", data.conversation.id], data);
      syncConversationListCaches(data.conversation);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (params: {
      conversationId: string;
      status?: "open" | "closed";
      allowUserReplies?: boolean;
    }) => {
      const response = await supportApi.updateConversationStatus(params.conversationId, {
        status: params.status,
        allowUserReplies: params.allowUserReplies,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onMutate: async (params) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: ["admin-support-conversations"] });

      const previousDetail =
        queryClient.getQueryData<AdminSupportConversationDetail>(detailKey);
      const previousListCaches =
        queryClient.getQueriesData<PaginatedAdminSupportConversationResult>({
          queryKey: ["admin-support-conversations"],
        });
      const currentConversation =
        previousDetail?.conversation ??
        conversationsQuery.data?.rows.find((row) => row.id === params.conversationId) ??
        null;

      if (!currentConversation) {
        return { previousDetail, previousListCaches };
      }

      const optimisticConversation: AdminSupportConversation = {
        ...currentConversation,
        status: params.status ?? currentConversation.status,
        allowUserReplies:
          typeof params.allowUserReplies === "boolean"
            ? params.allowUserReplies
            : currentConversation.allowUserReplies,
        updatedAt: new Date().toISOString(),
      };

      if (previousDetail) {
        queryClient.setQueryData<AdminSupportConversationDetail>(detailKey, {
          ...previousDetail,
          conversation: optimisticConversation,
        });
      }

      syncConversationListCaches(optimisticConversation);

      return { previousDetail, previousListCaches };
    },
    onError: (_error, params, context) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      if (context?.previousDetail) {
        queryClient.setQueryData(detailKey, context.previousDetail);
      }
      if (context?.previousListCaches) {
        restoreConversationListCaches(context.previousListCaches);
      }
    },
    onSuccess: (conversation, params) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      queryClient.setQueryData<AdminSupportConversationDetail | undefined>(
        detailKey,
        (current) =>
          current
            ? {
                ...current,
                conversation,
              }
            : current,
      );
      syncConversationListCaches(conversation);
    },
  });

  const selectedConversation = detailQuery.data?.conversation ?? null;
  const selectedMessages = detailQuery.data?.messages ?? [];
  const messengerConversations = useMemo(
    () =>
      (conversationsQuery.data?.rows ?? []).map((conversation) => ({
        id: conversation.id,
        name: conversation.user?.name ?? "Unknown user",
        title: conversation.subject ?? "General support",
        subtitle: conversation.user?.email ?? null,
        status:
          conversation.status === "open"
            ? ("online" as const)
            : ("offline" as const),
        unread: conversation.unreadForAdminCount,
        initials: toInitials(conversation.user?.name ?? conversation.user?.email ?? "Unknown"),
        preview:
          conversation.lastMessagePreview ??
          (conversation.lastMessageAt ? `Last activity ${formatDateTime(conversation.lastMessageAt)}` : "No messages yet"),
        messages:
          selectedConversationId === conversation.id
            ? selectedMessages.map((message) => ({
                id: message.id,
                sender: message.senderRole === "admin" ? ("self" as const) : ("other" as const),
                author:
                  message.senderRole === "admin"
                    ? "Admin"
                    : message.senderName ?? conversation.user?.name ?? "User",
                text: message.body,
                timestamp: formatDateTime(message.createdAt),
              }))
            : [],
        quickReplies: [
          "Please share the exact error message.",
          "Can you attach the payment reference or screenshot?",
          "I am checking this now.",
        ],
      })),
    [conversationsQuery.data?.rows, selectedConversationId, selectedMessages],
  );

  return (
    <div className="space-y-4">
      <Messenger
        title="Support Inbox"
        liveLabel={realtimeStatus === "live" ? "Live" : "Offline"}
        conversations={messengerConversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={(conversationId) => {
          setSelectedConversationId(conversationId);
          void navigate({
            to: Route.to,
            search: (current) => ({
              ...current,
              search: search || undefined,
              status,
              conversationId,
            }),
            replace: true,
          });
        }}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => {
          const nextSearch = searchInput.trim();
          setSearch(nextSearch);
          void navigate({
            to: Route.to,
            search: (current) => ({
              ...current,
              search: nextSearch || undefined,
              status,
              conversationId: current.conversationId,
            }),
            replace: true,
          });
        }}
        searchPlaceholder="Search name, email, subject..."
        sidebarControls={
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={status === "open" ? "default" : "outline"}
                onClick={() => {
                  setStatus("open");
                  void navigate({
                    to: Route.to,
                    search: (current) => ({
                      ...current,
                      search: search || undefined,
                      status: "open",
                      conversationId: current.conversationId,
                    }),
                    replace: true,
                  });
                }}
              >
                Open
              </Button>
              <Button
                type="button"
                variant={status === "closed" ? "default" : "outline"}
                onClick={() => {
                  setStatus("closed");
                  void navigate({
                    to: Route.to,
                    search: (current) => ({
                      ...current,
                      search: search || undefined,
                      status: "closed",
                      conversationId: current.conversationId,
                    }),
                    replace: true,
                  });
                }}
              >
                Closed
              </Button>
              <Button
                type="button"
                variant={status === "all" ? "default" : "outline"}
                onClick={() => {
                  setStatus("all");
                  void navigate({
                    to: Route.to,
                    search: (current) => ({
                      ...current,
                      search: search || undefined,
                      status: "all",
                      conversationId: current.conversationId,
                    }),
                    replace: true,
                  });
                }}
              >
                All
              </Button>
            </div>
            {conversationsQuery.isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {conversationsQuery.error instanceof Error
                  ? conversationsQuery.error.message
                  : "Failed to load support conversations."}
              </div>
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
              <Button
                type="button"
                variant="outline"
                disabled={statusMutation.isPending}
                onClick={() => {
                  void statusMutation.mutateAsync({
                    conversationId: selectedConversation.id,
                    status: selectedConversation.status === "open" ? "closed" : "open",
                  });
                }}
              >
                {selectedConversation.status === "open" ? "Close thread" : "Reopen thread"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={statusMutation.isPending}
                onClick={() => {
                  void statusMutation.mutateAsync({
                    conversationId: selectedConversation.id,
                    allowUserReplies: !selectedConversation.allowUserReplies,
                  });
                }}
              >
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
                  User can still read this thread, but new user messages are currently blocked by
                  admin.
                </div>
              ) : null}
              {detailQuery.isError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {detailQuery.error instanceof Error
                    ? detailQuery.error.message
                    : "Failed to load conversation detail."}
                </div>
              ) : null}
              {replyMutation.isError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {replyMutation.error instanceof Error
                    ? replyMutation.error.message
                    : "Failed to send reply."}
                </div>
              ) : null}
            </div>
          ) : null
        }
        draft={replyBody}
        onDraftChange={setReplyBody}
        onSubmit={() => {
          if (!selectedConversationId) {
            return;
          }
          void replyMutation.mutateAsync({
            conversationId: selectedConversationId,
            body: replyBody.trim(),
            subject: selectedConversation?.subject ?? undefined,
          });
        }}
        submitDisabled={
          replyMutation.isPending || !replyBody.trim() || !selectedConversationId
        }
        submitLabel={replyMutation.isPending ? "Sending..." : "Send Reply"}
        composerHint={
          selectedConversation
            ? `Replying to ${selectedConversation.user?.name ?? "user"}`
            : "Select a conversation first"
        }
        onQuickReply={setReplyBody}
        isThreadLoading={detailQuery.isLoading}
        emptyThread={
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No messages in this conversation yet.
          </div>
        }
        emptySelection={
          <div className="flex min-h-[720px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
            Select a support conversation to review the full chat thread.
          </div>
        }
      />
    </div>
  );
}
