CREATE TYPE "public"."PushPlatform" AS ENUM('android', 'ios');--> statement-breakpoint
CREATE TYPE "public"."PushProvider" AS ENUM('expo');--> statement-breakpoint
CREATE TABLE "push_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"installationId" text NOT NULL,
	"provider" "PushProvider" DEFAULT 'expo' NOT NULL,
	"platform" "PushPlatform" NOT NULL,
	"pushToken" text NOT NULL,
	"deviceLabel" text,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_registration_installationId_unique" UNIQUE("installationId")
);
--> statement-breakpoint
ALTER TABLE "push_registration" ADD CONSTRAINT "push_registration_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_registration_user_revoked_idx" ON "push_registration" USING btree ("userId","revokedAt");--> statement-breakpoint
CREATE INDEX "push_registration_token_idx" ON "push_registration" USING btree ("pushToken");