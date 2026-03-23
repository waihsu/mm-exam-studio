import { apiRequest } from "@/lib/api-client";
import type {
  CreateSupportMessageInput,
  SupportConversationDetail,
} from "../types/support.types";

export const getMySupportConversation = () =>
  apiRequest<SupportConversationDetail>("/api/v1/support/my/conversation");

export const createMySupportMessage = (payload: CreateSupportMessageInput) =>
  apiRequest<SupportConversationDetail>("/api/v1/support/my/messages", {
    method: "POST",
    body: payload,
  });
