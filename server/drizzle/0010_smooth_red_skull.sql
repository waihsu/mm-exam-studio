UPDATE "question"
SET "questionImageUrls" = null
WHERE
  "questionImageUrls" is not null
  and jsonb_typeof("questionImageUrls"::jsonb) <> 'array';--> statement-breakpoint
UPDATE "question"
SET "questionImageUrls" = (
  SELECT coalesce(
    jsonb_agg(element.value ORDER BY element.ordinality),
    '[]'::jsonb
  )::json
  FROM jsonb_array_elements("question"."questionImageUrls"::jsonb) WITH ORDINALITY AS element(value, ordinality)
  WHERE element.ordinality <= 4
)
WHERE
  "questionImageUrls" is not null
  and jsonb_typeof("questionImageUrls"::jsonb) = 'array'
  and jsonb_array_length("questionImageUrls"::jsonb) > 4;--> statement-breakpoint
UPDATE "question"
SET "solutionImageUrls" = null
WHERE
  "solutionImageUrls" is not null
  and jsonb_typeof("solutionImageUrls"::jsonb) <> 'array';--> statement-breakpoint
UPDATE "question"
SET "solutionImageUrls" = (
  SELECT coalesce(
    jsonb_agg(element.value ORDER BY element.ordinality),
    '[]'::jsonb
  )::json
  FROM jsonb_array_elements("question"."solutionImageUrls"::jsonb) WITH ORDINALITY AS element(value, ordinality)
  WHERE element.ordinality <= 4
)
WHERE
  "solutionImageUrls" is not null
  and jsonb_typeof("solutionImageUrls"::jsonb) = 'array'
  and jsonb_array_length("solutionImageUrls"::jsonb) > 4;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_image_urls_array_limit_ck" CHECK ("question"."questionImageUrls" is null
        or (
          jsonb_typeof("question"."questionImageUrls"::jsonb) = 'array'
          and jsonb_array_length("question"."questionImageUrls"::jsonb) <= 4
        ));--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "solution_image_urls_array_limit_ck" CHECK ("question"."solutionImageUrls" is null
        or (
          jsonb_typeof("question"."solutionImageUrls"::jsonb) = 'array'
          and jsonb_array_length("question"."solutionImageUrls"::jsonb) <= 4
        ));
