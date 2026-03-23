import { eq } from "drizzle-orm";
import { db, supportConversation } from "@/db";
import type {
  CreateSupportMessageInput,
  UpdateSupportConversationSettingsInput,
} from "../support.schema";
import {
  addSupportMessage,
  getSupportConversationById,
  listAdminSupportConversationPage,
  listSupportMessages,
  markSupportConversationRead,
} from "./support-shared.service";

export { listAdminSupportConversationPage };

export const getAdminSupportConversationDetail = async (conversationId: string) => {
  await markSupportConversationRead({
    conversationId,
    viewer: "admin",
  });

  const conversation = await getSupportConversationById(conversationId);
  if (!conversation) {
    throw new Error("Support conversation not found.");
  }

  const messages = await listSupportMessages(conversationId);

  return {
    conversation,
    messages,
  };
};

export const createAdminSupportMessage = async (
  conversationId: string,
  adminUserId: string,
  input: CreateSupportMessageInput,
) => {
  const conversation = await getSupportConversationById(conversationId);
  if (!conversation) {
    throw new Error("Support conversation not found.");
  }

  await addSupportMessage({
    conversationId,
    senderRole: "admin",
    senderUserId: adminUserId,
    body: input.body,
    subject: input.subject ?? conversation.subject ?? undefined,
  });

  const nextConversation = await getSupportConversationById(conversationId);
  if (!nextConversation) {
    throw new Error("Support conversation not found after reply.");
  }

  const messages = await listSupportMessages(conversationId);

  return {
    conversation: nextConversation,
    messages,
  };
};

export const updateAdminSupportConversationSettings = async (
  conversationId: string,
  input: UpdateSupportConversationSettingsInput,
) => {
  const [updated] = await db
    .update(supportConversation)
    .set({
      ...(input.status ? { status: input.status } : {}),
      ...(typeof input.allowUserReplies === "boolean"
        ? { allowUserReplies: input.allowUserReplies }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportConversation.id, conversationId))
    .returning();

  if (!updated) {
    throw new Error("Support conversation not found.");
  }

  const conversation = await getSupportConversationById(conversationId);
  if (!conversation) {
    throw new Error("Support conversation not found.");
  }

  return conversation;
};
