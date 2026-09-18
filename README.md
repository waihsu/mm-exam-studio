# MM Exam Studio

**An open-source exam-practice and question-paper workspace for Myanmar learners and educators.**

MM Exam Studio brings focused practice, question-paper authoring, answer review, and content administration into one platform. Core learning and paper-building features are open access: there are no subscription tiers, payment-proof uploads, or approval steps required to use them.

## Contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Database and demo data](#database-and-demo-data)
- [Development commands](#development-commands)
- [Quality checks](#quality-checks)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing and security](#contributing-and-security)

## Highlights

- Build targeted practice sessions and review answers with clear feedback.
- Create, revise, finalize, and export question papers as PDFs.
- Manage grades, subjects, question banks, review status, and publishing workflows from an admin console.
- Use the learner experience on the web or through the Expo mobile app.
- Authenticate with Better Auth, including mobile-friendly sessions and MFA support.
- Share type-safe contracts across the API and web applications.

## Architecture

| Workspace | Purpose | Stack |
| --- | --- | --- |
| `server/` | API, authentication, database access, PDF export, and seed scripts | Bun, Hono, Better Auth, Drizzle ORM |
| `client/` | Learner-facing web application | React, Vite, TanStack Router/Query |
| `admin/` | Content and operations console | React, Vite, TanStack Router/Query |
| `exam-studio/` | Android/iOS mobile application | Expo, React Native, Expo Router |
| `shared/` | Shared TypeScript contracts | TypeScript |
| `docs/` | Release, policy, and production guidance | Markdown |

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) 1.2.4 or newer
- Node.js 20 or newer for Expo development
- A PostgreSQL database available locally or remotely
- Android Studio/Xcode only when running the mobile app on a simulator or device

### 1. Install dependencies

From the repository root:

```bash
bun install

cd exam-studio
npm install
cd ..
```

### 2. Create local environment files

Create the server and mobile environment files from their examples.

```bash
# macOS/Linux
cp server/.env.example server/.env
cp exam-studio/.env.example exam-studio/.env
```

```powershell
# Windows PowerShell
Copy-Item server/.env.example server/.env
Copy-Item exam-studio/.env.example exam-studio/.env
```

Update `server/.env` with your database connection and a strong `BETTER_AUTH_SECRET` before using the app outside local development. The web applications default to `http://localhost:3000` in development; add `client/.env.local` or `admin/.env.local` only when you need to point them to another API URL.

### 3. Prepare the database

For an existing database, synchronize the schema and optionally add demo content:

```bash
cd server
bun run db:push
bun run seed:demo
cd ..
```

For a fresh database that should use the checked-in migrations instead, run `bun run db:migrate` from `server/`.

### 4. Start the applications

Run each long-lived process in its own terminal:

```bash
# API — http://localhost:3000
bun run dev:server

# Learner web app — typically http://localhost:5173
bun run dev:client

# Admin console — typically http://localhost:5174
bun run dev:admin
```

Start the mobile app separately:

```bash
cd exam-studio
npm run start
```

For an Android emulator, the default mobile API URL is `http://10.0.2.2:3000`. For a physical device, set `EXPO_PUBLIC_API_BASE_URL` in `exam-studio/.env` to your computer's LAN address, such as `http://192.168.1.10:3000`.

## Configuration

The examples contain safe local defaults. Do not commit `.env` files or production credentials.

| Application | File | Important values |
| --- | --- | --- |
| API | `server/.env` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `ADMIN_EMAILS` |
| Learner web app | `client/.env.local` (optional) | `VITE_SERVER_URL`, `VITE_APP_URL` |
| Admin console | `admin/.env.local` (optional) | `VITE_SERVER_URL`, `VITE_ADMIN_URL`, `VITE_STUDY_APP_URL` |
| Mobile app | `exam-studio/.env` | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_EAS_PROJECT_ID` |

`OPEN_SOURCE_MODE=true` keeps core study, paper-building, branding, and PDF-export features freely available. Subscription-related tables remain only for compatibility with earlier installations and do not restrict access in this mode.

## Database and demo data

Drizzle is the source of truth for schema changes.

| Task | Command (from `server/`) |
| --- | --- |
| Generate a migration after changing the schema | `bun run db:generate` |
| Apply checked-in migrations | `bun run db:migrate` |
| Synchronize an existing database schema | `bun run db:push` |
| Seed standard data | `bun run seed` |
| Seed demo data | `bun run seed:demo` |
| Run schema sync and seed demo data | `bun run db:push:seed:demo` |

Use `db:push` carefully against production: back up important data and deploy the API after schema changes so code and database remain compatible.

## Development commands

```bash
# Run all web/API development tasks through Turborepo
bun run dev

# Build all web/API workspaces
bun run build

# Lint all web/API workspaces
bun run lint

# Run available web/API tests
bun run test
```

Useful focused commands:

```bash
# Validate published-question integrity
cd server && bun run questions:audit

# Run API PDF export smoke test
cd server && bun run pdf:smoke

# Validate the mobile application and its environment
cd exam-studio && npm run check
```

## Quality checks

Before opening a pull request or preparing a release, run:

```bash
# Web/API production build, lint, tests, and PDF smoke test
bun run verify:release

# Mobile type and environment checks, then lint
cd exam-studio
npm run check
npm run lint
```

The release flow also includes manual checks for sign-in, practice, submission, answer review, paper creation, and mobile behavior. See [Release QA](docs/RELEASE_QA.md) for the complete checklist.

## Deployment

The web apps and API provide Cloudflare deployment scripts. Authenticate with Wrangler first, configure production environment values and secrets, then deploy the desired target:

```bash
# Confirm the active Cloudflare account
bun run cf:whoami

# Deploy one target
bun run cf:deploy:api
bun run cf:deploy:client
bun run cf:deploy:admin

# Deploy API and both web apps
bun run cf:deploy
```

Review the [Production launch checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md) before a public release. For mobile release setup, including EAS Build, see the [mobile app guide](exam-studio/README.md).

## Documentation

- [Release QA](docs/RELEASE_QA.md)
- [Production launch checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md)
- [Content policy](docs/CONTENT_POLICY.md)
- [Privacy policy](docs/PRIVACY_POLICY.md)
- [API and server guide](server/README.md)
- [Mobile app guide](exam-studio/README.md)

## Contributing and security

Contributions are welcome. Please read the [Contributing guide](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

To report a security issue privately, follow the instructions in the [Security policy](SECURITY.md). The project is released under the [MIT License](LICENSE).
