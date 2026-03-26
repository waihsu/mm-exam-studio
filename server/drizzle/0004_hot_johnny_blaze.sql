ALTER TABLE "question" ADD COLUMN "swapGroupId" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "variationNumber" integer;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "questionTopText" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "questionBottomText" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "questionImageUrls" json;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "solutionTopText" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "solutionBottomText" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "solutionImageUrls" json;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "parametricValueSets" json;--> statement-breakpoint
CREATE INDEX "question_swap_group_idx" ON "question" USING btree ("swapGroupId");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_variation_number_allowed_ck" CHECK ("question"."variationNumber" is null or "question"."variationNumber" between 1 and 3);