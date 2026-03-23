import { API_BASE_URL } from "@/lib/config";
import { getAuthToken } from "@/lib/auth-token-store";
import type { SupportConversationDetail } from "../types/support.types";

export type SupportRealtimeStatus = "connecting" | "live" | "offline";

type SupportRealtimeServerEvent =
  | {
      type: "snapshot";
      subscriptionKey: string;
      channel: "my-conversation";
      data: SupportConversationDetail;
    }
  | {
      type: "ready" | "pong" | "subscribed" | "unsubscribed";
    }
  | {
      type: "error";
      message: string;
    };

const buildSupportRealtimeUrl = () => {
  const parsed = new URL(API_BASE_URL);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = "/api/v1/support/realtime";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
};

const toJson = (payload: unknown) => JSON.stringify(payload);

export const connectMySupportConversationRealtime = async (params: {
  onSnapshot: (data: SupportConversationDetail) => void;
  onStatusChange?: (status: SupportRealtimeStatus) => void;
  onError?: (message: string) => void;
}) => {
  params.onStatusChange?.("connecting");
  const RealtimeWebSocket = WebSocket as unknown as {
    new (
      url: string,
      protocols?: string | string[] | null,
      options?: { headers?: Record<string, string> },
    ): WebSocket;
  };
  let isClosed = false;
  let reconnectAttempts = 0;
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let syncIntervalId: ReturnType<typeof setInterval> | null = null;
  let socket: WebSocket | null = null;

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

  const send = (payload: unknown) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(toJson(payload));
    }
  };

  const scheduleReconnect = () => {
    if (isClosed || reconnectTimeoutId) {
      return;
    }

    const delayMs = Math.min(15_000, 1_000 * 2 ** reconnectAttempts);
    reconnectAttempts += 1;
    params.onStatusChange?.("connecting");
    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null;
      void connect();
    }, delayMs);
  };

  const connect = async () => {
    if (isClosed) {
      return;
    }

    const token = await getAuthToken();
    if (isClosed) {
      return;
    }

    socket = new RealtimeWebSocket(
      buildSupportRealtimeUrl(),
      undefined,
      token
        ? {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );

    socket.onopen = () => {
      if (isClosed) return;
      reconnectAttempts = 0;
      clearReconnectTimeout();
      params.onStatusChange?.("live");
      send({ type: "subscribe", channel: "my-conversation" });
      send({ type: "sync" });
      clearSyncInterval();
      syncIntervalId = setInterval(() => {
        send({ type: "sync" });
        send({ type: "ping" });
      }, 5_000);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as SupportRealtimeServerEvent;
        if (payload.type === "snapshot" && payload.subscriptionKey === "my-conversation") {
          params.onSnapshot(payload.data);
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
      if (isClosed) return;
      params.onStatusChange?.("offline");
    };

    socket.onclose = () => {
      if (isClosed) return;
      clearSyncInterval();
      params.onStatusChange?.("offline");
      scheduleReconnect();
    };
  };

  await connect();

  return () => {
    isClosed = true;
    clearSyncInterval();
    clearReconnectTimeout();
    if (
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
  };
};
