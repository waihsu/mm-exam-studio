-- Run once on existing databases when moving from the old "Unlimited"
-- plan code/marketing to the new capped "Premium" plan.
-- Safe to run multiple times.

DO $$
BEGIN
  ALTER TYPE "PlanCode" RENAME VALUE 'unlimited' TO 'premium';
EXCEPTION
  WHEN invalid_parameter_value THEN NULL;
  WHEN feature_not_supported THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

UPDATE "plan"
SET
  "name" = 'Premium',
  "description" = 'High-volume teacher workflow with broader access, stronger protection, and generous monthly limits.',
  "deviceLimit" = 3,
  "maxQuestionsPerPractice" = 120,
  "maxQuestionsPerPaper" = 120,
  "monthlyPdfExportLimit" = 240,
  "monthlyPaperGenerationLimit" = 400,
  "monthlyPaperSwapLimit" = 400,
  "chatEnabled" = true,
  "generatorEnabled" = true,
  "brandingLogoLimit" = 2,
  "offlineDrmEnabled" = true,
  "screenshotBlockEnabled" = true,
  "printAllowed" = true,
  "updatedAt" = now()
WHERE "code" = 'premium';
