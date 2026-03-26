CREATE TYPE "public"."PaperBlueprintDifficulty" AS ENUM('easy', 'normal', 'hard', 'advance');--> statement-breakpoint
CREATE TYPE "public"."PaperBlueprintMode" AS ENUM('mcq_only', 'all_type', 'custom');--> statement-breakpoint
CREATE TYPE "public"."PaperBlueprintStatus" AS ENUM('draft', 'ready', 'archived');--> statement-breakpoint
CREATE TABLE "paper_blueprint" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"mode" "PaperBlueprintMode" DEFAULT 'custom' NOT NULL,
	"status" "PaperBlueprintStatus" DEFAULT 'draft' NOT NULL,
	"gradeId" text NOT NULL,
	"subjectId" text NOT NULL,
	"totalMarks" integer NOT NULL,
	"includeAnswerPaper" boolean DEFAULT false NOT NULL,
	"difficultyDistribution" json NOT NULL,
	"presetConfig" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paper_blueprint_total_marks_positive_ck" CHECK ("paper_blueprint"."totalMarks" > 0)
);
--> statement-breakpoint
CREATE TABLE "paper_blueprint_section" (
	"id" text PRIMARY KEY NOT NULL,
	"blueprintId" text NOT NULL,
	"code" text NOT NULL,
	"title" text,
	"questionType" "QuestionType",
	"marksPerQuestion" integer,
	"questionCount" integer NOT NULL,
	"totalMarks" integer NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paper_blueprint_section_blueprintId_code_unique" UNIQUE("blueprintId","code"),
	CONSTRAINT "paper_blueprint_section_blueprintId_sortOrder_unique" UNIQUE("blueprintId","sortOrder"),
	CONSTRAINT "paper_blueprint_section_question_count_positive_ck" CHECK ("paper_blueprint_section"."questionCount" > 0),
	CONSTRAINT "paper_blueprint_section_total_marks_positive_ck" CHECK ("paper_blueprint_section"."totalMarks" > 0),
	CONSTRAINT "paper_blueprint_section_marks_allowed_ck" CHECK ("paper_blueprint_section"."marksPerQuestion" is null or "paper_blueprint_section"."marksPerQuestion" in (1, 2, 3, 5, 10))
);
--> statement-breakpoint
CREATE TABLE "paper_blueprint_slot" (
	"id" text PRIMARY KEY NOT NULL,
	"blueprintId" text NOT NULL,
	"sectionId" text,
	"slotNumber" integer NOT NULL,
	"questionType" "QuestionType" NOT NULL,
	"marks" integer NOT NULL,
	"difficultyTarget" "PaperBlueprintDifficulty",
	"chapterId" text,
	"subChapterId" text,
	"lockedQuestionId" text,
	"generatedQuestionId" text,
	"swapLimit" integer DEFAULT 3 NOT NULL,
	"slotConfig" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paper_blueprint_slot_blueprintId_slotNumber_unique" UNIQUE("blueprintId","slotNumber"),
	CONSTRAINT "paper_blueprint_slot_marks_allowed_ck" CHECK ("paper_blueprint_slot"."marks" in (1, 2, 3, 5, 10)),
	CONSTRAINT "paper_blueprint_slot_swap_limit_positive_ck" CHECK ("paper_blueprint_slot"."swapLimit" > 0)
);
--> statement-breakpoint
ALTER TABLE "paper_blueprint" ADD CONSTRAINT "paper_blueprint_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint" ADD CONSTRAINT "paper_blueprint_gradeId_grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint" ADD CONSTRAINT "paper_blueprint_subjectId_subject_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_section" ADD CONSTRAINT "paper_blueprint_section_blueprintId_paper_blueprint_id_fk" FOREIGN KEY ("blueprintId") REFERENCES "public"."paper_blueprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_blueprintId_paper_blueprint_id_fk" FOREIGN KEY ("blueprintId") REFERENCES "public"."paper_blueprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_sectionId_paper_blueprint_section_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."paper_blueprint_section"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_chapterId_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_subChapterId_sub_chapter_id_fk" FOREIGN KEY ("subChapterId") REFERENCES "public"."sub_chapter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_lockedQuestionId_question_id_fk" FOREIGN KEY ("lockedQuestionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_blueprint_slot" ADD CONSTRAINT "paper_blueprint_slot_generatedQuestionId_question_id_fk" FOREIGN KEY ("generatedQuestionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paper_blueprint_user_updated_idx" ON "paper_blueprint" USING btree ("userId","updatedAt");--> statement-breakpoint
CREATE INDEX "paper_blueprint_status_idx" ON "paper_blueprint" USING btree ("status");--> statement-breakpoint
CREATE INDEX "paper_blueprint_section_blueprint_idx" ON "paper_blueprint_section" USING btree ("blueprintId");--> statement-breakpoint
CREATE INDEX "paper_blueprint_slot_blueprint_idx" ON "paper_blueprint_slot" USING btree ("blueprintId");--> statement-breakpoint
CREATE INDEX "paper_blueprint_slot_section_idx" ON "paper_blueprint_slot" USING btree ("sectionId");