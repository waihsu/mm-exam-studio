import { useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { showSupportReplyNotification } from "@/features/practice/services/practice-reminder-notification.service";
import { SUPPORT_QUERY_KEYS } from "../constants/query-keys";
import {
  connectMySupportConversationRealtime,
  type SupportRealtimeStatus,
} from "../services/support-realtime.service";
import type { SupportConversationDetail } from "../types/support.types";

type UseMySupportConversationRealtimeOptions = {
  notifyOnAdminReply?: boolean;
};

type SupportRealtimeListener = {
  onStatus: (status: SupportRealtimeStatus) => void;
  onError: (message: string | null) => void;
};

const supportRealtimeManager = {
  cleanup: null as null | (() => void),
  errorMessage: null as string | null,
  hydrated: false,
  isStarting: false,
  lastAdminMessageId: null as string | null,
  listeners: new Set<SupportRealtimeListener>(),
  notifyConsumerCount: 0,
  queryClient: null as QueryClient | null,
  refCount: 0,
  status: "offline" as SupportRealtimeStatus,
};

const emitSupportRealtimeState = () => {
  for (const listener of supportRealtimeManager.listeners) {
    listener.onStatus(supportRealtimeManager.status);
    listener.onError(supportRealtimeManager.errorMessage);
  }
};

const resetSupportRealtimeManager = () => {
  supportRealtimeManager.cleanup = null;
  supportRealtimeManager.errorMessage = null;
  supportRealtimeManager.hydrated = false;
  supportRealtimeManager.isStarting = false;
  supportRealtimeManager.lastAdminMessageId = null;
  supportRealtimeManager.notifyConsumerCount = 0;
  supportRealtimeManager.queryClient = null;
  supportRealtimeManager.refCount = 0;
  supportRealtimeManager.status = "offline";
};

const maybeNotifyAdminReply = async (data: SupportConversationDetail) => {
  const latestMessage = data.messages[data.messages.length - 1];
  if (!latestMessage || latestMessage.senderRole !== "admin") {
    supportRealtimeManager.hydrated = true;
    return;
  }

  const shouldNotify =
    supportRealtimeManager.hydrated &&
    supportRealtimeManager.notifyConsumerCount > 0 &&
    latestMessage.id !== supportRealtimeManager.lastAdminMessageId;

  supportRealtimeManager.lastAdminMessageId = latestMessage.id;
  supportRealtimeManager.hydrated = true;

  if (!shouldNotify) {
    return;
  }

  await showSupportReplyNotification({
    conversationId: data.conversation.id,
    senderName: latestMessage.senderName ?? "Admin",
    body: latestMessage.body,
  }).catch(() => undefined);
};

const ensureSupportRealtimeConnection = async (queryClient: QueryClient) => {
  if (
    supportRealtimeManager.cleanup ||
    supportRealtimeManager.isStarting ||
    supportRealtimeManager.refCount === 0
  ) {
    return;
  }

  supportRealtimeManager.isStarting = true;
  supportRealtimeManager.queryClient = queryClient;
  supportRealtimeManager.status = "connecting";
  emitSupportRealtimeState();

  try {
    const cleanup = await connectMySupportConversationRealtime({
      onSnapshot: (data: SupportConversationDetail) => {
        supportRealtimeManager.queryClient?.setQueryData(
          SUPPORT_QUERY_KEYS.myConversation(),
          data,
        );
        void maybeNotifyAdminReply(data);
      },
      onStatusChange: (nextStatus) => {
        supportRealtimeManager.status = nextStatus;
        emitSupportRealtimeState();
      },
      onError: (message) => {
        supportRealtimeManager.errorMessage = message;
        emitSupportRealtimeState();
      },
    });

    if (supportRealtimeManager.refCount === 0) {
      cleanup();
      resetSupportRealtimeManager();
      emitSupportRealtimeState();
      return;
    }

    supportRealtimeManager.cleanup = () => {
      cleanup();
      resetSupportRealtimeManager();
      emitSupportRealtimeState();
    };
  } finally {
    supportRealtimeManager.isStarting = false;
  }
};

export const useMySupportConversationRealtime = (
  enabled = true,
  options: UseMySupportConversationRealtimeOptions = {},
) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SupportRealtimeStatus>(
    enabled ? supportRealtimeManager.status : "offline",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    enabled ? supportRealtimeManager.errorMessage : null,
  );

  useEffect(() => {
    if (!enabled) {
      setStatus("offline");
      setErrorMessage(null);
      return;
    }

    const listener: SupportRealtimeListener = {
      onStatus: setStatus,
      onError: setErrorMessage,
    };

    supportRealtimeManager.listeners.add(listener);
    supportRealtimeManager.refCount += 1;
    if (options.notifyOnAdminReply) {
      supportRealtimeManager.notifyConsumerCount += 1;
    }

    setStatus(supportRealtimeManager.status);
    setErrorMessage(supportRealtimeManager.errorMessage);
    void ensureSupportRealtimeConnection(queryClient);

    return () => {
      supportRealtimeManager.listeners.delete(listener);
      supportRealtimeManager.refCount = Math.max(0, supportRealtimeManager.refCount - 1);
      if (options.notifyOnAdminReply) {
        supportRealtimeManager.notifyConsumerCount = Math.max(
          0,
          supportRealtimeManager.notifyConsumerCount - 1,
        );
      }

      if (supportRealtimeManager.refCount === 0 && supportRealtimeManager.cleanup) {
        supportRealtimeManager.cleanup();
      }
    };
  }, [enabled, options.notifyOnAdminReply, queryClient]);

  return {
    status,
    errorMessage,
  };
};
