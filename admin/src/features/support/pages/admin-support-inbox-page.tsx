import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AdminPageHeader, AdminStatPill } from "@/components/page-shell";
import { supportApi } from "@/features/support/api/support.api";
import { AdminSupportInboxWorkspace } from "@/features/support/components/admin-support-inbox-workspace";
import { connectAdminSupportRealtime } from "@/features/support/realtime/support-realtime";
import {
  getSupportConversationListCacheEntries,
  restoreSupportConversationListCaches,
  syncSupportConversationListCaches,
} from "@/features/support/utils/support-conversation-cache";
import type {
  AdminSupportConversation,
  AdminSupportConversationDetail,
  AdminSupportMessage,
} from "@/features/support/types";

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "No activity";

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

export type SupportInboxSearch = {
  search?: string;
  status?: "all" | "open" | "closed";
  conversationId?: string;
};

type AdminSupportInboxPageProps = {
  routeSearch: SupportInboxSearch;
};

export function AdminSupportInboxPage({ routeSearch }: AdminSupportInboxPageProps) {
  const navigate = useNavigate();
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
      const previousListCaches = getSupportConversationListCacheEntries(queryClient);

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
      syncSupportConversationListCaches(queryClient, optimisticDetail.conversation);

      return { previousDetail, previousListCaches };
    },
    onError: (_error, params, context) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      if (context?.previousDetail) {
        queryClient.setQueryData(detailKey, context.previousDetail);
      }
      if (context?.previousListCaches) {
        restoreSupportConversationListCaches(queryClient, context.previousListCaches);
      }
    },
    onSuccess: (data) => {
      setReplyBody("");
      queryClient.setQueryData(["admin-support-conversation-detail", data.conversation.id], data);
      syncSupportConversationListCaches(queryClient, data.conversation);
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
      const previousListCaches = getSupportConversationListCacheEntries(queryClient);
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

      syncSupportConversationListCaches(queryClient, optimisticConversation);

      return { previousDetail, previousListCaches };
    },
    onError: (_error, params, context) => {
      const detailKey = ["admin-support-conversation-detail", params.conversationId] as const;
      if (context?.previousDetail) {
        queryClient.setQueryData(detailKey, context.previousDetail);
      }
      if (context?.previousListCaches) {
        restoreSupportConversationListCaches(queryClient, context.previousListCaches);
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
      syncSupportConversationListCaches(queryClient, conversation);
    },
  });

  const selectedConversation = detailQuery.data?.conversation ?? null;
  const selectedMessages = useMemo(
    () => detailQuery.data?.messages ?? [],
    [detailQuery.data?.messages],
  );
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
          "Can you attach a screenshot or the relevant details?",
          "I am checking this now.",
        ],
      })),
    [conversationsQuery.data?.rows, selectedConversationId, selectedMessages],
  );

  const conversationRows = conversationsQuery.data?.rows ?? [];
  const openCount = conversationRows.filter((conversation) => conversation.status === "open").length;
  const unreadCount = conversationRows.reduce(
    (sum, conversation) => sum + conversation.unreadForAdminCount,
    0,
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Support Inbox"
        title="Review conversations and keep replies moving"
        description="Search user threads, watch realtime activity, and reply without leaving the workspace."
        actions={
          <div className="grid gap-2 sm:grid-cols-3">
            <AdminStatPill label="Visible threads" value={`${conversationRows.length}`} />
            <AdminStatPill label="Open now" value={`${openCount}`} tone="cyan" />
            <AdminStatPill label="Unread" value={`${unreadCount}`} tone="amber" />
          </div>
        }
        chips={
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
            Realtime: {realtimeStatus === "live" ? "Live" : "Offline"}
          </span>
        }
      />

      <AdminSupportInboxWorkspace
        conversations={messengerConversations}
        selectedConversationId={selectedConversationId}
        selectedConversation={selectedConversation}
        realtimeStatus={realtimeStatus}
        realtimeError={realtimeError}
        conversationsError={
          conversationsQuery.error instanceof Error ? conversationsQuery.error : null
        }
        detailError={detailQuery.error instanceof Error ? detailQuery.error : null}
        replyError={replyMutation.error instanceof Error ? replyMutation.error : null}
        draft={replyBody}
        sending={replyMutation.isPending}
        updatingStatus={statusMutation.isPending}
        threadLoading={detailQuery.isLoading}
        onSelectConversation={(conversationId) => {
          setSelectedConversationId(conversationId);
          void navigate({
            to: "/users/support",
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
            to: "/users/support",
            search: (current) => ({
              ...current,
              search: nextSearch || undefined,
              status,
              conversationId: current.conversationId,
            }),
            replace: true,
          });
        }}
        filterStatus={status}
        onFilterStatusChange={(nextStatus) => {
          setStatus(nextStatus);
          void navigate({
            to: "/users/support",
            search: (current) => ({
              ...current,
              search: search || undefined,
              status: nextStatus,
              conversationId: current.conversationId,
            }),
            replace: true,
          });
        }}
        onToggleConversationStatus={() => {
          if (!selectedConversation) return;
          void statusMutation.mutateAsync({
            conversationId: selectedConversation.id,
            status: selectedConversation.status === "open" ? "closed" : "open",
          });
        }}
        onToggleUserReplies={() => {
          if (!selectedConversation) return;
          void statusMutation.mutateAsync({
            conversationId: selectedConversation.id,
            allowUserReplies: !selectedConversation.allowUserReplies,
          });
        }}
        onDraftChange={setReplyBody}
        onSubmitReply={() => {
          if (!selectedConversationId) return;
          void replyMutation.mutateAsync({
            conversationId: selectedConversationId,
            body: replyBody.trim(),
            subject: selectedConversation?.subject ?? undefined,
          });
        }}
        onQuickReply={setReplyBody}
      />
    </div>
  );
}
