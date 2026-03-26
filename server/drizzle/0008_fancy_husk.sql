UPDATE "question"
SET
  "swapGroupId" = null,
  "variationNumber" = null
WHERE
  ("swapGroupId" is null and "variationNumber" is not null)
  or ("swapGroupId" is not null and "variationNumber" is null);--> statement-breakpoint
UPDATE "question"
SET "swapGroupId" = null
WHERE "swapGroupId" is not null and length(trim("swapGroupId")) = 0;--> statement-breakpoint
WITH duplicated AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "swapGroupId", "variationNumber"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "rn"
  FROM "question"
  WHERE "swapGroupId" is not null and "variationNumber" is not null
)
UPDATE "question" AS q
SET
  "swapGroupId" = null,
  "variationNumber" = null
FROM duplicated
WHERE q."id" = duplicated."id" and duplicated."rn" > 1;--> statement-breakpoint
CREATE INDEX "question_catalog_lookup_idx" ON "question" USING btree ("isPublished","isActive","gradeId","subjectId","chapterId","subChapterId","type","marks","updatedAt");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_swapGroupId_variationNumber_unique" UNIQUE("swapGroupId","variationNumber");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_swap_group_not_blank_ck" CHECK ("question"."swapGroupId" is null or length(trim("question"."swapGroupId")) > 0);--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_swap_group_variation_pair_ck" CHECK (("question"."swapGroupId" is null and "question"."variationNumber" is null) or ("question"."swapGroupId" is not null and "question"."variationNumber" is not null));
