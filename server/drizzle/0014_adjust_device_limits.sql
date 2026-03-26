UPDATE "plan"
SET "deviceLimit" = CASE
  WHEN "code" = 'free' THEN 2
  WHEN "code" = 'pro' THEN 3
  WHEN "code" = 'premium' THEN 5
  ELSE "deviceLimit"
END
WHERE "code" IN ('free', 'pro', 'premium');
