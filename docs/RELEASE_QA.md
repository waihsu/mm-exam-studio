# Release QA

Run this against an isolated test database with a seeded learner and admin account. Never use a real learner account or production data for test automation.

## Learner web and mobile

1. Sign in, sign out, and sign in again.
2. Start Practice; select grade, subject, and available scope; create a session.
3. Submit one correct and one incorrect answer; complete the session.
4. Confirm the review screen shows the saved answer, correct answer, explanation, and score accurately.
5. Create a paper, save a draft, finalize it, and preview/export a PDF.
6. Open Help, Support, Legal, and Open Access. Confirm no payment, billing, upgrade, or payment-proof language appears.
7. On a small viewport/device, repeat steps 2–4 and check that controls are reachable and readable.

## Admin web

1. Sign in as an admin and create/edit a draft question.
2. Verify invalid multiple-choice, true/false, matching, and answer-key data cannot be published.
3. Publish a valid question and confirm it becomes selectable in learner Practice.
4. Check support conversation replies and content moderation controls if enabled.

## Automation follow-up

Add browser/mobile E2E coverage only after CI has a disposable PostgreSQL database, deterministic seed profile, and non-production test accounts. The minimum automated path is: sign in → build practice session → answer → submit → review.
