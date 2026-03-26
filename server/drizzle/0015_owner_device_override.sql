UPDATE "subscription"
SET "deviceLimitOverride" = 20,
    "updatedAt" = now()
WHERE "userId" IN (
  SELECT "id"
  FROM "user"
  WHERE lower("email") IN ('admin@hsuwai.space', 'hsuw647@gmail.com')
);
