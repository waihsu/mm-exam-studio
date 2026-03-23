import { eq } from "drizzle-orm";
import { db, supportConversation } from "@/db";
import type { CreateSupportMessageInput } from "../support.schema";
import {
  addSupportMessage,
  ensureSupportConversationForUser,
  getSupportConversationById,
  listSupportMessages,
  markSupportConversationRead,
} from "./support-shared.service";

export const getMySupportConversation = async (userId: string) => {
  const conversationRow = await ensureSupportConversationForUser(userId);
  await markSupportConversationRead({
    conversationId: conversationRow.id,
    viewer: "user",
  });

  const conversation = await getSupportConversationById(conversationRow.id);
  if (!conversation) {
    throw new Error("Support conversation not found.");
  }

  const messages = await listSupportMessages(conversation.id);

  return {
    conversation,
    messages,
  };
};

export const createMySupportMessage = async (
  userId: string,
  input: CreateSupportMessageInput,
) => {
  const conversationRow = await ensureSupportConversationForUser(userId);
  if (!conversationRow.allowUserReplies) {
    throw new Error(
      "Admin has turned off replies for this support thread. Please wait for admin to reopen it.",
    );
  }
  await addSupportMessage({
    conversationId: conversationRow.id,
    senderRole: "user",
    senderUserId: userId,
    body: input.body,
    subject: input.subject,
  });

  const [updatedConversationRow] = await db
    .select()
    .from(supportConversation)
    .where(eq(supportConversation.id, conversationRow.id))
    .limit(1);

  const conversation = updatedConversationRow
    ? await getSupportConversationById(updatedConversationRow.id)
    : null;

  if (!conversation) {
    throw new Error("Support conversation not found after sending.");
  }

  const messages = await listSupportMessages(conversation.id);

  return {
    conversation,
    messages,
  };
};
