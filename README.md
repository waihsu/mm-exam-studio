# MM Exam Studio

> An open-source learning workspace for Myanmar learners, educators, and content teams.

MM Exam Studio brings practice, question-paper creation, answer review, and content operations into a single platform. Learners can build focused study sessions and review their progress; educators can assemble export-ready papers; administrators can maintain a governed question bank.

The project is open by design. Core practice, paper-building, branding, and PDF-export capabilities are available without subscription tiers, payment-proof uploads, or upgrade approvals.

## What you can do

| For learners | For educators and content teams | For operators |
| --- | --- | --- |
| Build targeted practice sessions | Create, revise, finalize, and export question papers | Manage authentication, roles, and platform configuration |
| Submit answers and review clear feedback | Organize grades, subjects, and question banks | Run database migrations, seed data, and release checks |
| Use the study experience on web or mobile | Review content before publishing | Deploy the API and web applications independently |

## Platform overview

```text
                  ┌──────────────────────┐
                  │      Shared types    │
                  │       shared/        │
                  └──────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ Learner web app│  │      API         │  │  Admin console  │
│    client/     │◄─┤    server/       ├─►│     admin/       │
└────────────────┘  │ Hono + Drizzle  │  └─────────────────┘
                    │ + Better Auth    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Mobile app      │
                    │  exam-studio/     │
                    └──────────────────┘
```

| Workspace | Responsibility | Primary tools |
| --- | --- | --- |
| `server/` | API, authentication, database access, PDF export, and seed scripts | Bun, Hono, Better Auth, Drizzle ORM |
| `client/` | Learner-facing web experience | React, Vite, TanStack Router/Query |
| `admin/` | Content and operations console | React, Vite, TanStack Router/Query |
| `exam-studio/` | Android and iOS mobile experience | Expo, React Native, Expo Router |
| `shared/` | Shared TypeScript contracts | TypeScript |
| `docs/` | Release, policy, and production documentation | Markdown |

## Quick start

### Requirements

- [Bun](https://bun.sh/) 1.2.4 or newer
- Node.js 20 or newer for the Expo mobile app
- A PostgreSQL database, local or remote
- Android Studio or Xcode only when testing mobile builds on a simulator or device

### 1. Install dependencies

```bash
# Web/API workspaces
bun install

# Mobile workspace
cd exam-studio
npm install
cd ..
```

### 2. Configure local development

Create the API and mobile environment files from their committed examples.

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

Set a real database connection and a strong `BETTER_AUTH_SECRET` in `server/.env` before sharing an environment. The web applications target `http://localhost:3000` by default; create `client/.env.local` or `admin/.env.local` only when using a different API address.

### 3. Initialize the database

For an existing database, synchronize the schema and load demo content:

```bash
cd server
bun run db:push
bun run seed:demo
cd ..
```

For a new database that should use the checked-in migration history, run `bun run db:migrate` from `server/` instead.

### 4. Run the platform

Start each service in a separate terminal.

| Service | Command | Default URL |
| --- | --- | --- |
| API | `bun run dev:server` | `http://localhost:3000` |
| Learner web app | `bun run dev:client` | `http://localhost:5173` |
| Admin console | `bun run dev:admin` | `http://localhost:5174` |
| Mobile app | `cd exam-studio && npm run start` | Expo development server |

The Android emulator reaches a backend on the host computer through `http://10.0.2.2:3000`. For a physical device, set `EXPO_PUBLIC_API_BASE_URL` in `exam-studio/.env` to your computer's LAN address, for example `http://192.168.1.10:3000`.

## Configuration reference

Environment files are intentionally excluded from Git. Never commit credentials, service-account files, Firebase configuration, or Wrangler configuration.

| Application | Local file | Values to configure |
| --- | --- | --- |
| API | `server/.env` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `ADMIN_EMAILS` |
| Learner web app | `client/.env.local` | `VITE_SERVER_URL`, `VITE_APP_URL` |
| Admin console | `admin/.env.local` | `VITE_SERVER_URL`, `VITE_ADMIN_URL`, `VITE_STUDY_APP_URL` |
| Mobile app | `exam-studio/.env` | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_EAS_PROJECT_ID` |

`OPEN_SOURCE_MODE=true` keeps the core learning experience open. Legacy subscription data remains available for compatibility but does not limit access in open-source mode.

## Database workflow

Drizzle is the source of truth for database schema changes.

| Goal | Command from `server/` |
| --- | --- |
| Generate a migration after schema changes | `bun run db:generate` |
| Apply checked-in migrations | `bun run db:migrate` |
| Synchronize an existing database | `bun run db:push` |
| Seed standard data | `bun run seed` |
| Seed demo data | `bun run seed:demo` |
| Synchronize and seed demo data | `bun run db:push:seed:demo` |

Back up production data before schema changes. After applying a schema change, deploy the API version that expects it.

## Development and verification

```bash
# Start all available web/API development tasks
bun run dev

# Build all web/API workspaces
bun run build

# Lint and test available web/API workspaces
bun run lint
bun run test

# Complete web/API release verification
bun run verify:release
```

Focused checks:

```bash
# Published-question integrity audit
cd server && bun run questions:audit

# PDF export smoke test
cd server && bun run pdf:smoke

# Mobile environment and TypeScript validation
cd exam-studio && npm run check
npm run lint
```

The complete manual release flow—including authentication, practice, answer submission, paper creation, and mobile testing—is in [Release QA](docs/RELEASE_QA.md).

## Deployment

The API and web applications can be deployed with the Cloudflare scripts declared in the root `package.json`:

```bash
bun run cf:whoami
bun run cf:deploy:api
bun run cf:deploy:client
bun run cf:deploy:admin
```

Wrangler configuration files are deliberately ignored and are not included in this repository. Create and maintain those deployment-specific files privately, then configure production secrets in Cloudflare. Review the [Production launch checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md) before a public release.

For mobile release setup, local Android artifacts, and EAS Build guidance, see the [mobile app guide](exam-studio/README.md).

## Documentation

- [API and server guide](server/README.md)
- [Mobile app guide](exam-studio/README.md)
- [Release QA](docs/RELEASE_QA.md)
- [Production launch checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md)
- [Content policy](docs/CONTENT_POLICY.md)
- [Privacy policy](docs/PRIVACY_POLICY.md)

## Contributing and security

Contributions are welcome. Please read the [Contributing guide](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

To report a security issue privately, follow the [Security policy](SECURITY.md). MM Exam Studio is available under the [MIT License](LICENSE).
