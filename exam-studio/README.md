# Exam Studio Mobile (Android First)

Expo + React Native app for the mobile client.

## Run locally

1. Install dependencies
   ```bash
   npm install
   ```
2. Create environment file
   ```bash
   cp .env.example .env
   ```
3. Start backend API (from repo root)
   ```bash
   cd ../server
   npm run dev
   ```
4. Start Android app (from `exam-studio`)
   ```bash
   npm run android
   ```

If you run on a physical Android device, change `EXPO_PUBLIC_API_BASE_URL` in `.env` to your backend machine LAN IP (for example `http://192.168.1.10:3000`).

For production Android builds in this repo, use:

```env
EXPO_PUBLIC_API_BASE_URL=https://examapi.hsuwai.space
```

Then run:

```bash
npm run android:apk:local
```

## App navigation (current)

- `Practice` tab: question catalog, filters, quick practice, selected-question practice
- `Papers` tab: paper drafts, exports, exam paper creation flow
- `Settings` tab: account preferences, notifications, security, change password
- Non-tab routes:
  - `sign-in`
  - `mfa`
  - `practice/sessions`
  - `practice/:sessionId`
  - `papers/:paperId`

## Auth flow

- Sign in endpoint: `POST /api/auth/sign-in/email`
- MFA endpoints:
  - `POST /api/auth/two-factor/verify-totp`
  - `POST /api/auth/two-factor/verify-backup-code`
- Session bootstrap: Better Auth `getSession` client
- Bearer token persisted via `expo-secure-store`
- Protected data example: `GET /api/v1/workspace/summary`

## Current structure

- `src/app`: Expo Router routes (`(tabs)` + auth + paper/practice detail screens)
- `src/features`: feature-based modules (`auth`, `practice`, `papers`, `settings`, `workspace`, `app-shell`)
- `src/components`: shared UI primitives (bottom sheet, filter summary bar, themed wrappers)
- `src/lib`: app config + API client + Better Auth client + TanStack Query client

## Validation commands

```bash
npm run check
```

or

```bash
npm run lint
```

## Production readiness notes

- `EXPO_PUBLIC_API_BASE_URL` is validated at runtime:
  - dev: local/non-https allowed
  - production build: must be `https://...` and not local/private host
- API client uses request timeout (15s default) and normalized error messages.
- Auth transitions clear TanStack cache to avoid stale/cross-user data.
- Auth session is auto-refreshed when app returns to foreground.
- Query retry only applies to network/timeouts/5xx (not 4xx auth/validation).
- Practice session answers auto-save to secure storage and clear on submit.

## Production build quick steps

1. Set production env:
   - copy `.env.production.example` and set real API URL
2. Run checks:
   ```bash
   npm install
   npm run check
   ```
3. Build:
   - local Android release:
     ```bash
     npm run android:apk:local
     ```
   - EAS build (recommended):
     ```bash
     npx eas build --platform android --profile production
     ```

## CI/CD workflows

Repository includes GitHub Actions workflows:

- `.github/workflows/exam-studio-mobile-ci.yml`
  - Runs on PR/push affecting `exam-studio/**`
  - Installs deps, validates env, runs typecheck, and runs lint
- `.github/workflows/exam-studio-mobile-release.yml`
  - Manual trigger (`workflow_dispatch`)
  - Validates production env and triggers EAS build

Required secret for release workflow:

- `EAS_TOKEN`
