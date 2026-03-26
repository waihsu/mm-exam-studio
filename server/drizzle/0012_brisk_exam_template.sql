ALTER TABLE "paper_blueprint"
  ADD COLUMN "pdfTemplateKey" text DEFAULT 'default' NOT NULL,
  ADD COLUMN "examYearLabel" text,
  ADD COLUMN "timeAllowedLabel" text,
  ADD COLUMN "departmentLine" text,
  ADD COLUMN "answerInstructionLine" text;

ALTER TABLE "question_paper"
  ADD COLUMN "pdfTemplateKey" text DEFAULT 'default' NOT NULL,
  ADD COLUMN "examYearLabel" text,
  ADD COLUMN "timeAllowedLabel" text,
  ADD COLUMN "departmentLine" text,
  ADD COLUMN "answerInstructionLine" text;
