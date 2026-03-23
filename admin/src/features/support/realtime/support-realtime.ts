import type {
  AdminSupportConversationDetail,
  PaginatedAdminSupportConversationResult,
} from "../types";

type AdminSupportRealtimeStatus = "connecting" | "live" | "offline";

type AdminSupportRealtimeEvent =
  | {
      type: "snapshot";
      subscriptionKey: string;
      channel: "admin-conversations";
      data: PaginatedAdminSupportConversationResult;
    }
  | {
      type: "snapshot";
      subscriptionKey: string;
      channel: "admin-conversation";
      data: AdminSupportConversationDetail;
    }
  | {
      type: "ready" | "pong" | "subscribed" | "unsubscribed";
    }
  | {
      type: "error";
      message: string;
    };

const configuredServerUrl = (import.meta.env.VITE_SERVER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin.trim() : "";
const configuredAdminUrl = (import.meta.env.VITE_ADMIN_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const buildRealtimeUrl = () => {
  const base =
    configuredServerUrl ||
    runtimeOrigin ||
    configuredAdminUrl ||
    "http://localhost:3000";
  const parsed = new URL(base);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = "/api/v1/support/realtime";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
};

export const connectAdminSupportRealtime = (params: {
  search: string;
  status: "all" | "open" | "closed";
  selectedConversationId: string | null;
  onStatusChange?: (status: AdminSupportRealtimeStatus) => void;
  onConversationsSnapshot: (data: PaginatedAdminSupportConversationResult) => void;
  onConversationDetailSnapshot: (data: AdminSupportConversationDetail) => void;
  onError?: (message: string) => void;
}) => {
  params.onStatusChange?.("connecting");
  let closed = false;
  let reconnectAttempts = 0;
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let syncIntervalId: ReturnType<typeof setInterval> | null = null;
  let socket: WebSocket | null = null;

  const send = (payload: unknown) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const subscribeAll = () => {
    send({
      type: "subscribe",
      channel: "admin-conversations",
      filters: {
        page: 1,
        pageSize: 50,
        ...(params.search ? { search: params.search } : {}),
        ...(params.status !== "all" ? { status: params.status } : {}),
      },
    });

    if (params.selectedConversationId) {
      send({
        type: "subscribe",
        channel: "admin-conversation",
        conversationId: params.selectedConversationId,
      });
    }

    send({ type: "sync" });
  };

  const clearSyncInterval = () => {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
  };

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimeoutId) {
      return;
    }

    const delayMs = Math.min(15_000, 1_000 * 2 ** reconnectAttempts);
    reconnectAttempts += 1;
    params.onStatusChange?.("connecting");
    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null;
      connect();
    }, delayMs);
  };

  const connect = () => {
    if (closed) {
      return;
    }

    socket = new WebSocket(buildRealtimeUrl());

    socket.onopen = () => {
      if (closed) return;
      reconnectAttempts = 0;
      clearReconnectTimeout();
      params.onStatusChange?.("live");
      subscribeAll();
      clearSyncInterval();
      syncIntervalId = setInterval(() => {
        send({ type: "sync" });
        send({ type: "ping" });
      }, 5_000);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as AdminSupportRealtimeEvent;

        if (
          payload.type === "snapshot" &&
          payload.channel === "admin-conversations" &&
          payload.subscriptionKey === "admin-conversations"
        ) {
          params.onConversationsSnapshot(payload.data);
          return;
        }

        if (
          payload.type === "snapshot" &&
          payload.channel === "admin-conversation" &&
          params.selectedConversationId &&
          payload.subscriptionKey === `admin-conversation:${params.selectedConversationId}`
        ) {
          params.onConversationDetailSnapshot(payload.data);
          return;
        }

        if (payload.type === "error") {
          params.onError?.(payload.message);
        }
      } catch {
        params.onError?.("Failed to read support realtime update.");
      }
    };

    socket.onerror = () => {
      if (closed) return;
      params.onStatusChange?.("offline");
    };

    socket.onclose = () => {
      if (closed) return;
      clearSyncInterval();
      params.onStatusChange?.("offline");
      scheduleReconnect();
    };
  };

  connect();

  return () => {
    closed = true;
    clearSyncInterval();
    clearReconnectTimeout();
    if (
      socket?.readyState === WebSocket.CONNECTING ||
      socket?.readyState === WebSocket.OPEN
    ) {
      socket.close();
    }
  };
};
