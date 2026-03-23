CREATE TYPE "public"."AccountStatus" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."BillingCycle" AS ENUM('monthly', 'yearly', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."DeviceType" AS ENUM('mobile', 'desktop', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."Difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."PlanCode" AS ENUM('free', 'pro', 'premium');--> statement-breakpoint
CREATE TYPE "public"."PracticeSessionStatus" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."QuestionMode" AS ENUM('static', 'variable');--> statement-breakpoint
CREATE TYPE "public"."QuestionPaperStatus" AS ENUM('draft', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."QuestionReviewStatus" AS ENUM('draft', 'in_review', 'needs_changes', 'approved');--> statement-breakpoint
CREATE TYPE "public"."QuestionType" AS ENUM('mcq', 'true_false', 'short_answer', 'fill_blank', 'matching');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionRequestStatus" AS ENUM('pending', 'approved', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionStatus" AS ENUM('active', 'canceled', 'past_due', 'expired');--> statement-breakpoint
CREATE TYPE "public"."SupportConversationStatus" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."SupportMessageSenderRole" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entityType" text,
	"entityId" text,
	"actorUserId" text,
	"ipAddress" text,
	"userAgent" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"label" text NOT NULL,
	"imageDataUrl" text NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"gradeId" text NOT NULL,
	"subjectId" text NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFreePreview" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_gradeId_subjectId_name_unique" UNIQUE("gradeId","subjectId","name")
);
--> statement-breakpoint
CREATE TABLE "device_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriptionId" text NOT NULL,
	"userId" text NOT NULL,
	"deviceKey" text NOT NULL,
	"deviceType" "DeviceType" DEFAULT 'unknown' NOT NULL,
	"deviceLabel" text,
	"userAgent" text,
	"firstSeenAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_registration_userId_deviceKey_unique" UNIQUE("userId","deviceKey")
);
--> statement-breakpoint
CREATE TABLE "grade" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grade_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "grade_subject" (
	"gradeId" text NOT NULL,
	"subjectId" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grade_subject_gradeId_subjectId_pk" PRIMARY KEY("gradeId","subjectId")
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"code" "PlanCode" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"deviceLimit" integer DEFAULT 1 NOT NULL,
	"maxQuestionsPerPractice" integer,
	"maxQuestionsPerPaper" integer,
	"monthlyPdfExportLimit" integer,
	"monthlyPaperGenerationLimit" integer,
	"monthlyPaperSwapLimit" integer,
	"chatEnabled" boolean DEFAULT false NOT NULL,
	"generatorEnabled" boolean DEFAULT true NOT NULL,
	"brandingLogoLimit" integer DEFAULT 0 NOT NULL,
	"offlineDrmEnabled" boolean DEFAULT false NOT NULL,
	"screenshotBlockEnabled" boolean DEFAULT false NOT NULL,
	"printAllowed" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "practice_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text,
	"status" "PracticeSessionStatus" DEFAULT 'active' NOT NULL,
	"gradeId" text,
	"subjectId" text,
	"chapterId" text,
	"subChapterId" text,
	"totalQuestions" integer DEFAULT 0 NOT NULL,
	"correctAnswers" integer DEFAULT 0 NOT NULL,
	"scorePercent" real,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_session_item" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"questionId" text NOT NULL,
	"position" integer NOT NULL,
	"questionCode" text NOT NULL,
	"questionType" "QuestionType" NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"renderedBody" text NOT NULL,
	"renderedExplanation" text,
	"renderedAnswerText" text,
	"renderedOptions" json,
	"variableContext" json,
	"submittedAnswer" text,
	"isCorrect" boolean,
	"answeredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "practice_session_item_sessionId_position_unique" UNIQUE("sessionId","position"),
	CONSTRAINT "practice_session_item_marks_allowed_ck" CHECK ("practice_session_item"."marks" in (1, 2, 3, 5, 10))
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"questionCode" text NOT NULL,
	"gradeId" text NOT NULL,
	"subjectId" text NOT NULL,
	"chapterId" text,
	"subChapterId" text,
	"type" "QuestionType" DEFAULT 'mcq' NOT NULL,
	"difficulty" "Difficulty" DEFAULT 'medium' NOT NULL,
	"mode" "QuestionMode" DEFAULT 'static' NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"explanation" text,
	"answerText" text,
	"answerFormula" text,
	"variablesSchema" json,
	"reviewStatus" "QuestionReviewStatus" DEFAULT 'draft' NOT NULL,
	"reviewNotes" text,
	"marks" integer DEFAULT 1 NOT NULL,
	"estimatedTimeSec" integer,
	"isPublished" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdBy" text,
	"reviewedBy" text,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_questionCode_unique" UNIQUE("questionCode"),
	CONSTRAINT "question_marks_allowed_ck" CHECK ("question"."marks" in (1, 2, 3, 5, 10))
);
--> statement-breakpoint
CREATE TABLE "question_option" (
	"id" text PRIMARY KEY NOT NULL,
	"questionId" text NOT NULL,
	"label" text,
	"text" text NOT NULL,
	"isCorrect" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_option_questionId_label_unique" UNIQUE("questionId","label"),
	CONSTRAINT "question_option_questionId_sortOrder_unique" UNIQUE("questionId","sortOrder")
);
--> statement-breakpoint
CREATE TABLE "question_paper" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"brandAssetId" text,
	"title" text NOT NULL,
	"instructions" text,
	"schoolName" text,
	"academicYear" text,
	"status" "QuestionPaperStatus" DEFAULT 'draft' NOT NULL,
	"includeAnswerKey" boolean DEFAULT false NOT NULL,
	"gradeId" text,
	"subjectId" text,
	"chapterId" text,
	"subChapterId" text,
	"totalQuestions" integer DEFAULT 0 NOT NULL,
	"totalMarks" integer DEFAULT 0 NOT NULL,
	"exportedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_paper_item" (
	"id" text PRIMARY KEY NOT NULL,
	"paperId" text NOT NULL,
	"questionId" text NOT NULL,
	"position" integer NOT NULL,
	"questionCode" text NOT NULL,
	"questionType" "QuestionType" NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"renderedBody" text NOT NULL,
	"renderedAnswerText" text,
	"renderedOptions" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_paper_item_paperId_position_unique" UNIQUE("paperId","position"),
	CONSTRAINT "question_paper_item_marks_allowed_ck" CHECK ("question_paper_item"."marks" in (1, 2, 3, 5, 10))
);
--> statement-breakpoint
CREATE TABLE "sub_chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"chapterId" text NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFreePreview" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_chapter_chapterId_name_unique" UNIQUE("chapterId","name")
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"planId" text NOT NULL,
	"status" "SubscriptionStatus" DEFAULT 'active' NOT NULL,
	"billingCycle" "BillingCycle" DEFAULT 'monthly' NOT NULL,
	"startsAt" timestamp DEFAULT now() NOT NULL,
	"endsAt" timestamp,
	"currentPeriodStart" timestamp DEFAULT now() NOT NULL,
	"currentPeriodEnd" timestamp,
	"deviceLimitOverride" integer,
	"maxQuestionsPerPracticeOverride" integer,
	"maxQuestionsPerPaperOverride" integer,
	"monthlyPdfExportLimitOverride" integer,
	"monthlyPaperGenerationLimitOverride" integer,
	"monthlyPaperSwapLimitOverride" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "subscription_request" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"requestedPlanCode" "PlanCode" NOT NULL,
	"status" "SubscriptionRequestStatus" DEFAULT 'pending' NOT NULL,
	"transactionId" text,
	"paymentProofImageDataUrl" text,
	"note" text,
	"adminNote" text,
	"reviewedBy" text,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"subject" text,
	"status" "SupportConversationStatus" DEFAULT 'open' NOT NULL,
	"allowUserReplies" boolean DEFAULT true NOT NULL,
	"lastMessagePreview" text,
	"lastMessageAt" timestamp,
	"unreadForAdminCount" integer DEFAULT 0 NOT NULL,
	"unreadForUserCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_conversation_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "support_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"senderRole" "SupportMessageSenderRole" NOT NULL,
	"senderUserId" text,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counter" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriptionId" text NOT NULL,
	"userId" text NOT NULL,
	"periodKey" text NOT NULL,
	"pdfExportsUsed" integer DEFAULT 0 NOT NULL,
	"paperGenerationsUsed" integer DEFAULT 0 NOT NULL,
	"paperSwapsUsed" integer DEFAULT 0 NOT NULL,
	"chatMessagesUsed" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usage_counter_userId_periodKey_unique" UNIQUE("userId","periodKey")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"twoFactorEnabled" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"accountStatus" text DEFAULT 'active' NOT NULL,
	"accountStatusReason" text,
	"accountStatusChangedAt" timestamp,
	"passwordResetRequiredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_account_status_check" CHECK ("user"."accountStatus" in ('active', 'suspended', 'deactivated')),
	CONSTRAINT "user_role_check" CHECK ("user"."role" in ('user', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_asset" ADD CONSTRAINT "brand_asset_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_registration" ADD CONSTRAINT "device_registration_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_registration" ADD CONSTRAINT "device_registration_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_subject" ADD CONSTRAINT "grade_subject_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_subject" ADD CONSTRAINT "grade_subject_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_chapterId_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_subChapterId_sub_chapter_id_fk" FOREIGN KEY ("subChapterId") REFERENCES "public"."sub_chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_item" ADD CONSTRAINT "practice_session_item_sessionId_practice_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."practice_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_item" ADD CONSTRAINT "practice_session_item_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_chapterId_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_subChapterId_sub_chapter_id_fk" FOREIGN KEY ("subChapterId") REFERENCES "public"."sub_chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_brandAssetId_brand_asset_id_fk" FOREIGN KEY ("brandAssetId") REFERENCES "public"."brand_asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_chapterId_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper" ADD CONSTRAINT "question_paper_subChapterId_sub_chapter_id_fk" FOREIGN KEY ("subChapterId") REFERENCES "public"."sub_chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_paperId_question_paper_id_fk" FOREIGN KEY ("paperId") REFERENCES "public"."question_paper"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_chapter" ADD CONSTRAINT "sub_chapter_chapterId_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_planId_plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_request" ADD CONSTRAINT "subscription_request_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_request" ADD CONSTRAINT "subscription_request_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_conversationId_support_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."support_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_senderUserId_user_id_fk" FOREIGN KEY ("senderUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actorUserId");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "brand_asset_user_created_idx" ON "brand_asset" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "chapter_grade_subject_idx" ON "chapter" USING btree ("gradeId","subjectId");--> statement-breakpoint
CREATE INDEX "device_registration_subscription_revoked_idx" ON "device_registration" USING btree ("subscriptionId","revokedAt");--> statement-breakpoint
CREATE INDEX "grade_subject_subjectId_idx" ON "grade_subject" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "practice_session_user_created_idx" ON "practice_session" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "practice_session_status_idx" ON "practice_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "practice_session_item_session_idx" ON "practice_session_item" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "practice_session_item_question_idx" ON "practice_session_item" USING btree ("questionId");--> statement-breakpoint
CREATE INDEX "question_taxonomy_idx" ON "question" USING btree ("gradeId","subjectId","chapterId","subChapterId");--> statement-breakpoint
CREATE INDEX "question_option_question_idx" ON "question_option" USING btree ("questionId");--> statement-breakpoint
CREATE INDEX "question_paper_user_created_idx" ON "question_paper" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "question_paper_brand_idx" ON "question_paper" USING btree ("brandAssetId");--> statement-breakpoint
CREATE INDEX "question_paper_status_idx" ON "question_paper" USING btree ("status");--> statement-breakpoint
CREATE INDEX "question_paper_exported_idx" ON "question_paper" USING btree ("exportedAt");--> statement-breakpoint
CREATE INDEX "question_paper_item_paper_idx" ON "question_paper_item" USING btree ("paperId");--> statement-breakpoint
CREATE INDEX "question_paper_item_question_idx" ON "question_paper_item" USING btree ("questionId");--> statement-breakpoint
CREATE INDEX "sub_chapter_chapter_idx" ON "sub_chapter" USING btree ("chapterId");--> statement-breakpoint
CREATE INDEX "subscription_plan_idx" ON "subscription" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_request_user_status_created_idx" ON "subscription_request" USING btree ("userId","status","createdAt");--> statement-breakpoint
CREATE INDEX "subscription_request_status_created_idx" ON "subscription_request" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "subscription_request_reviewedBy_idx" ON "subscription_request" USING btree ("reviewedBy");--> statement-breakpoint
CREATE INDEX "support_conversation_status_last_message_idx" ON "support_conversation" USING btree ("status","lastMessageAt");--> statement-breakpoint
CREATE INDEX "support_conversation_user_idx" ON "support_conversation" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "support_message_conversation_created_idx" ON "support_message" USING btree ("conversationId","createdAt");--> statement-breakpoint
CREATE INDEX "support_message_sender_idx" ON "support_message" USING btree ("senderUserId");--> statement-breakpoint
CREATE INDEX "usage_counter_subscription_idx" ON "usage_counter" USING btree ("subscriptionId");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "account_provider_account_idx" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expiresAt_idx" ON "session" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_account_status_idx" ON "user" USING btree ("accountStatus");--> statement-breakpoint
CREATE INDEX "user_password_reset_required_idx" ON "user" USING btree ("passwordResetRequiredAt");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expiresAt_idx" ON "verification" USING btree ("expiresAt");