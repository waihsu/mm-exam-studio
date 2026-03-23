# MM Exam Studio Production Go-Live Runbook

Last updated: `2026-03-23`

## 1. Target URLs

- User app: `https://examstudio.hsuwai.space`
- Admin app: `https://adminstudio.hsuwai.space`
- API:
  - `https://examapi.hsuwai.space/api/*` for Android app production builds
  - `https://examstudio.hsuwai.space/api/*`
  - `https://adminstudio.hsuwai.space/api/*`

## 2. One-Time Preconditions

1. Cloudflare projects/services exist:
   - Pages: `examstudio`, `adminstudio`
   - Workers: `mm-exam-studio-api`, `mm-exam-studio-pdf-renderer`
2. Database is production-grade and reachable from Workers (`DATABASE_URL`).
3. Redis is configured for distributed rate limiting:
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
   - or `REDIS_URL`

## 3. Set Secrets (Required Before Deploy)

Run from `/home/hsuwai/Documents/mm-exam-studio/server`.

```bash
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put UPSTASH_REDIS_REST_URL
bunx wrangler secret put UPSTASH_REDIS_REST_TOKEN
```

Optional secrets:

```bash
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put PDF_RENDERER_TOKEN
```

Optional runtime vars for manual subscription payments:

- `SUBSCRIPTION_PAYMENT_CHANNEL_NAME`
- `SUBSCRIPTION_PAYMENT_ACCOUNT_NAME`
- `SUBSCRIPTION_PAYMENT_ACCOUNT_REFERENCE`
- `SUBSCRIPTION_PAYMENT_URL`
- `SUBSCRIPTION_PAYMENT_INSTRUCTIONS`
- `SUBSCRIPTION_SUPPORT_LABEL`
- `SUBSCRIPTION_SUPPORT_CONTACT`
- `SUBSCRIPTION_SUPPORT_URL`
- `SUBSCRIPTION_SUPPORT_EMAIL`
- `SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES`
- `SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES`

## 4. Runtime Config Baseline

`server/wrangler.jsonc` should keep these production flags enabled:

- `AUTH_SECURITY_MIDDLEWARE_ENABLED=true`
- `AUTH_BRUTE_FORCE_MIDDLEWARE_ENABLED=true`
- `AUTH_SIGN_IN_ACCOUNT_CHECKS_ENABLED=true`
- `AUTH_SIGN_IN_DEVICE_CHECKS_ENABLED=true`
- `AUTH_SIGN_IN_AUDIT_ENABLED=true`
- `SECURITY_HEADERS_ENABLED=true`
- `AUTH_MFA_ISSUER=Study Admin`

For manual subscription payments, also verify:

- payment channel/account details are configured for the current business account
- `SUBSCRIPTION_PAYMENT_URL` opens the right payment entry point if you want one-tap payment from mobile
- support contact points to a monitored channel
- `SUBSCRIPTION_SUPPORT_URL` opens the right chat or support page if configured
- `SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES` is small enough to protect DB growth
- `SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES` is larger than proof limit but still conservative

## 5. Database Migration Order

Drizzle schema is now the primary source of truth.

For an existing production database with real data:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:push
```

For a fresh database from scratch:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:migrate
```

If you change schema files in the future:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:generate
```

If you also need seed data after schema sync:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:push:seed
```

Legacy standalone SQL files such as [mfa-schema.sql](/home/hsuwai/Documents/mm-exam-studio/server/scripts/mfa-schema.sql), [subscription-premium-cap.sql](/home/hsuwai/Documents/mm-exam-studio/server/scripts/subscription-premium-cap.sql), and [support-chat-schema.sql](/home/hsuwai/Documents/mm-exam-studio/server/scripts/support-chat-schema.sql) should be treated as legacy/manual fallback only, not the primary go-live path.

Seed command (if you need fresh content):

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
SEED_PUBLISH_ALL_QUESTIONS=true bun run seed
```

## 6. Pre-Deploy Build Gate

Run from `/home/hsuwai/Documents/mm-exam-studio`:

```bash
bun run build
```

No deploy if this fails.

## 7. Deploy Order

Run from `/home/hsuwai/Documents/mm-exam-studio`:

```bash
bun run cf:whoami
bun run cf:deploy:api
bun run cf:deploy:client
bun run cf:deploy:admin
```

## 8. Post-Deploy Smoke (Must Pass)

1. Admin sign in with MFA challenge flow (`requiresTwoFactor` path).
2. Enable MFA in admin settings:
   - QR setup
   - OTP verify
   - backup code regeneration
3. Question lifecycle:
   - draft -> publish
   - published status persists without stuck "Saving..."
4. Plan gating:
   - free user sees only free-allowed questions
   - pro/premium access behaves as expected
5. Practice session create/submit.
6. Paper create/swap/reorder/finalize.
7. PDF download and branding header render.
8. Subscription request submit + admin approve/reject.
9. Payment proof preview opens correctly on mobile and admin can review the uploaded image.
10. Security checks:
   - suspicious sign-in alerts visible in admin security page
   - rate limit responses return `429` under forced burst

Note:

- Payment proof images are currently stored inline in the database for simplicity.
- This is fine for the current manual-review flow with strict size limits.
- If upload volume grows, move proofs to object storage and keep only URLs/metadata in DB.

## 9. Client Handover Gate

Share with client only when all are true:

- Build gate passed
- Drizzle `db:push` or `db:migrate` applied successfully
- Secrets configured
- Smoke checklist passed
- At least one backup DB snapshot taken after go-live deploy

## 10. Current Non-Goals

- Automatic payment gateway
- DRM / watermark / offline controls
- Fully managed WAF rules (if Cloudflare plan does not include WAF)
