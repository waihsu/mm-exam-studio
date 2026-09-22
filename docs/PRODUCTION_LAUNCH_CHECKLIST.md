# MM Exam Studio production launch checklist

Use this checklist before opening the hosted app to learners. Do not commit real credentials or private user data to Git.

## 1. Production configuration

- [ ] Create a production Neon/Postgres database and apply every Drizzle migration: `cd server && bun run db:migrate`.
- [ ] Set Worker secrets with `wrangler secret put` for `DATABASE_URL`, `BETTER_AUTH_SECRET`, email-provider credentials, Redis/Upstash credentials, and `PDF_RENDERER_TOKEN`.
- [ ] Set the public frontend API URL to `https://examapi.hsuwai.space` in the Client and Admin Cloudflare Pages environment variables.
- [ ] Replace example admin emails, sender addresses, and product copy with the actual organization values.
- [ ] Keep `ALLOW_INSECURE_MEMORY_SECURITY_STORE=false` and use a real Redis/Upstash store in production.

## 2. Required release checks

- [ ] Run `bun run verify:release` from the repository root. It builds all workspaces, runs lint, and runs Admin's automated tests.
- [ ] The API liveness endpoint `https://<api-domain>/api/health`, Client, Admin, and PDF renderer are reachable over HTTPS after deployment.
- [ ] Confirm no production response includes a secret, stack trace, database URL, or reset token.

## 3. Real-user acceptance path

Run this with a brand-new non-admin account in production:

- [ ] Sign up, verify email, sign out, and sign in again.
- [ ] Request a password reset and complete the reset from the delivered email.
- [ ] Create a practice session: grade and subject must be selected before start.
- [ ] Answer, submit, refresh, and confirm the score remains correct.
- [ ] Create a paper, edit/reorder a question, finalize it, and open/export the PDF.
- [ ] Test the finished PDF on a phone and desktop printer.
- [ ] Send a support message and confirm it appears in Admin.
- [ ] Confirm a new learner can sign in and create a practice session without access gates.
- [ ] Confirm paper generation, PDF export, and branding work for a standard learner account.

## 4. Operational ownership

- [ ] Assign one person to review support messages and content reports daily.
- [ ] Publish the support email, privacy policy, and acceptable-use guidance before opening access.
- [ ] Set a database backup/retention policy and test one restore.
- [ ] Enable Cloudflare Worker logs/alerts and assign an owner for failed PDF jobs and email delivery failures.
- [ ] Keep an emergency rollback: previous Pages deployment, known-good Worker version, and database migration history.

## 5. What is intentionally not automated yet

Open-source mode removes the commercial access gates. It does not replace responsible hosting, account security, backups, or content review. Keep `OPEN_SOURCE_MODE=true` in the server environment to preserve open access.
