ALTER TABLE "question_paper_item" ADD COLUMN "blueprintSectionId" text;--> statement-breakpoint
ALTER TABLE "question_paper_item" ADD COLUMN "blueprintSlotId" text;--> statement-breakpoint
ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_blueprintSectionId_paper_blueprint_section_id_fk" FOREIGN KEY ("blueprintSectionId") REFERENCES "public"."paper_blueprint_section"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_paper_item" ADD CONSTRAINT "question_paper_item_blueprintSlotId_paper_blueprint_slot_id_fk" FOREIGN KEY ("blueprintSlotId") REFERENCES "public"."paper_blueprint_slot"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_paper_item_blueprint_section_idx" ON "question_paper_item" USING btree ("blueprintSectionId");--> statement-breakpoint
CREATE INDEX "question_paper_item_blueprint_slot_idx" ON "question_paper_item" USING btree ("blueprintSlotId");