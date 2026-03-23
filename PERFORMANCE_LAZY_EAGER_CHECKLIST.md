# MM Exam Studio Lazy/Eager Checklist

Goal: keep first load and Worker cold start fast without causing route-level jank.

## Keep Eager (core path)

- `client/src/main.tsx`
  - Router + QueryClient bootstrap should stay eager.
- `client/src/lib/query-client.ts`
  - Global query defaults stay eager.
- `client/src/routes/_app.tsx`
  - Auth gate loader stays eager/cached for protected UX.
- `admin/src/main.tsx`
  - Router + QueryClient bootstrap should stay eager.
- `admin/src/lib/query-client.ts`
  - Global query defaults stay eager.
- `server/src/app.ts`
  - Core middleware, CORS, error handling must stay eager.
- `server/src/worker.ts`
  - Worker entrypoint must stay minimal/eager.

## Keep Lazy (heavy/feature path)

- `client/src/routes/__root.tsx`
  - `@tanstack/react-router-devtools` remains dev-only lazy.
- `admin/src/features/questions/components/math-text-preview.tsx`
  - KaTeX CSS + runtime remain dynamic import.
- `server/src/routes/v1-routes.ts`
  - Feature modules (`workspace`, `subscriptions`, `questions`, `taxonomy`) stay lazy-loaded.
- `server/src/modules/auth/auth.route.ts`
  - `@/lib/auth` and `auth.service` stay lazy-loaded.
- `server/src/modules/workspace/workspace.route.ts`
  - Local PDF generation path (`./workspace-pdf`) stays dynamic import fallback.
- `server/src/db/index.ts`
  - DB adapter (`neon-http` vs `node-postgres`) stays runtime-based dynamic import.

## Newly Applied Optimizations

- `server/src/routes/v1-routes.ts`
  - Lazy sub-route module loaders are now cached after first load.
- `server/src/pdf-worker.ts`
  - `workspace-pdf` is now loaded lazily on `/render` instead of worker startup.

## Avoid

- Do not remove all lazy imports globally.
  - Frontend: larger initial JS parse/compile cost and slower first render.
  - Worker: higher cold start CPU/memory risk and more 1102 exposure on heavy modules.

## Quick Validation After Deploy

- `/api/v1/me` should not refetch on every route change (except cache invalidation/expiry).
- Auth routes (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`) should return without 1102.
- First open of question editor may load KaTeX once; subsequent opens should be warm/cached.
- PDF export path should work via `PDF_RENDERER` service; fallback path still valid when unbound.
