import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { supportApi } from "../api/support-api";
import { SUPPORT_QUERY_KEYS } from "../constants/query-keys";
import type { SupportConversationDetail, SupportMessage } from "../types/support.types";

export function useCreateSupportMessageMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthFlow();
  const queryKey = SUPPORT_QUERY_KEYS.myConversation();

  return useMutation({
    mutationFn: async (payload: { body: string; subject?: string }) => {
      const response = await supportApi.createMyMessage(payload);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
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
        senderName: user?.name ?? "You",
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
}
