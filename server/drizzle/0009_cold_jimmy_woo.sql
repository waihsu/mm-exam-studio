UPDATE "question"
SET "marks" = CASE
  WHEN "type" in ('mcq', 'true_false', 'fill_blank') THEN 1
  WHEN "type" = 'short_answer' AND "marks" NOT IN (2, 3) THEN 2
  WHEN "type" = 'matching' THEN 5
  WHEN "type" = 'long_answer' THEN 10
  ELSE "marks"
END
WHERE
  ("type" in ('mcq', 'true_false', 'fill_blank') and "marks" <> 1)
  or ("type" = 'short_answer' and "marks" not in (2, 3))
  or ("type" = 'matching' and "marks" <> 5)
  or ("type" = 'long_answer' and "marks" <> 10);--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_type_marks_match_ck" CHECK (("question"."type" in ('mcq', 'true_false', 'fill_blank') and "question"."marks" = 1)
        or ("question"."type" = 'short_answer' and "question"."marks" in (2, 3))
        or ("question"."type" = 'matching' and "question"."marks" = 5)
        or ("question"."type" = 'long_answer' and "question"."marks" = 10));
