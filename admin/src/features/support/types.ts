export type AdminSupportConversationStatus = "open" | "closed";
export type AdminSupportMessageSenderRole = "user" | "admin";

export type AdminSupportConversation = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  subject: string | null;
  status: AdminSupportConversationStatus;
  allowUserReplies: boolean;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadForAdminCount: number;
  unreadForUserCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportMessage = {
  id: string;
  conversationId: string;
  senderRole: AdminSupportMessageSenderRole;
  senderUserId: string | null;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type AdminSupportConversationDetail = {
  conversation: AdminSupportConversation;
  messages: AdminSupportMessage[];
};

export type PaginatedAdminSupportConversationResult = {
  rows: AdminSupportConversation[];
  total: number;
  page: number;
  pageSize: number;
};
