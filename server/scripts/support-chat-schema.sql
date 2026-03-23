-- Run once to create user/admin support conversation tables.

DO $$
BEGIN
  CREATE TYPE "SupportConversationStatus" AS ENUM ('open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "SupportMessageSenderRole" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "support_conversation" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "subject" text,
  "status" "SupportConversationStatus" NOT NULL DEFAULT 'open',
  "allowUserReplies" boolean NOT NULL DEFAULT true,
  "lastMessagePreview" text,
  "lastMessageAt" timestamp,
  "unreadForAdminCount" integer NOT NULL DEFAULT 0,
  "unreadForUserCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "support_message" (
  "id" text PRIMARY KEY,
  "conversationId" text NOT NULL REFERENCES "support_conversation"("id") ON DELETE CASCADE,
  "senderRole" "SupportMessageSenderRole" NOT NULL,
  "senderUserId" text REFERENCES "user"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "support_conversation_status_last_message_idx"
  ON "support_conversation" ("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "support_conversation_user_idx"
  ON "support_conversation" ("userId");
CREATE INDEX IF NOT EXISTS "support_message_conversation_created_idx"
  ON "support_message" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "support_message_sender_idx"
  ON "support_message" ("senderUserId");

ALTER TABLE "support_conversation"
  ADD COLUMN IF NOT EXISTS "allowUserReplies" boolean NOT NULL DEFAULT true;
