import { requestServerJson } from "@/lib/server-http";
import type {
  CreateSupportMessageInput,
  SupportConversationDetail,
} from "../types/support.types";

export const supportApi = {
  async getMyConversation() {
    return requestServerJson<SupportConversationDetail>("/api/v1/support/my/conversation");
  },
  async createMyMessage(payload: CreateSupportMessageInput) {
    return requestServerJson<SupportConversationDetail>("/api/v1/support/my/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
};
