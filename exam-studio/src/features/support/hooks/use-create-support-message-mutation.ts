import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SUPPORT_QUERY_KEYS } from "../constants/query-keys";
import type { SupportConversationDetail, SupportMessage } from "../types/support.types";
import { createMySupportMessage } from "../services/support.service";

export const useCreateSupportMessageMutation = () => {
  const queryClient = useQueryClient();
  const queryKey = SUPPORT_QUERY_KEYS.myConversation();

  return useMutation({
    mutationFn: createMySupportMessage,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<SupportConversationDetail>(queryKey);
      const trimmedBody = payload.body.trim();
      const trimmedSubject = payload.subject?.trim() || null;

      if (!previousData || trimmedBody.length === 0) {
        return { previousData };
      }

      const optimisticMessage: SupportMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId: previousData.conversation.id,
        senderRole: "user",
        senderUserId: previousData.conversation.userId,
        senderName: previousData.conversation.user?.name ?? "You",
        body: trimmedBody,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<SupportConversationDetail>(queryKey, {
        conversation: {
          ...previousData.conversation,
          subject: previousData.conversation.subject ?? trimmedSubject,
          status: "open",
          lastMessagePreview: trimmedBody,
          lastMessageAt: optimisticMessage.createdAt,
          updatedAt: optimisticMessage.createdAt,
          unreadForAdminCount: previousData.conversation.unreadForAdminCount + 1,
          unreadForUserCount: 0,
        },
        messages: [...previousData.messages, optimisticMessage],
      });

      return { previousData };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
};
