export type SupportConversationStatus = "open" | "closed";
export type SupportMessageSenderRole = "user" | "admin";

export type SupportConversationSummary = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  subject: string | null;
  status: SupportConversationStatus;
  allowUserReplies: boolean;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadForAdminCount: number;
  unreadForUserCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderRole: SupportMessageSenderRole;
  senderUserId: string | null;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type SupportConversationDetail = {
  conversation: SupportConversationSummary;
  messages: SupportMessage[];
};

export type CreateSupportMessageInput = {
  body: string;
  subject?: string;
};
