# MM Exam Studio

An open-source study workspace for Myanmar learners and educators. Create targeted practice sessions, build question papers, review answers with clear feedback, and manage learning content from one product.

MM Exam Studio is intentionally **open access**: core study tools do not use subscription tiers, payment proof uploads, or upgrade approval flows.

## What is included

- Learner web app for practice, answer review, and paper building
- Admin web app for managing question content and publishing readiness
- Hono API with Better Auth, Drizzle, and PDF export support
- Expo mobile app for Android/iOS development
- Shared TypeScript types used by the web apps and API

## Repository layout

```text
admin/          Admin content workspace
client/         Learner web application
exam-studio/    Expo mobile application
server/         API, auth, database, PDF, and seed scripts
shared/         Shared TypeScript package
docs/           Release, QA, and production guidance
```

## Local development

Prerequisites: Bun 1.2+, Node.js 20+ (for Expo), and a local PostgreSQL database.

```bash
# Web/API workspace dependencies
bun install

# Mobile workspace dependencies
cd exam-studio
npm install
cd ..

# Create local configuration files from the examples, then set database/auth values.
Copy-Item server/.env.example server/.env
Copy-Item exam-studio/.env.example exam-studio/.env

# Apply the database schema and load demo data when desired.
cd server
bun run db:push
bun run seed:demo
cd ..

# Run the API, learner web app, and admin app in separate terminals.
bun run dev:server
bun run dev:client
bun run dev:admin

# Run the Expo app in a separate terminal.
cd exam-studio
npm run start
```

Never commit `.env` files or real credentials. See the example environment files and [Production launch checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md) before deploying.

## Quality checks

```bash
# Web/API production build, lint, tests, and PDF smoke test
bun run verify:release

# Published question integrity audit
cd server
bun run questions:audit

# Mobile TypeScript and environment validation
cd ../exam-studio
npm run check
npm run lint
```

The manual end-to-end release flow is documented in [Release QA](docs/RELEASE_QA.md). It covers sign-in, practice, submission, answer review, paper creation, and mobile verification against a controlled test database.

## Contributing and security

- [Contributing guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Content policy](docs/CONTENT_POLICY.md)
- [Privacy policy](docs/PRIVACY_POLICY.md)

The project is licensed under the [MIT License](LICENSE).
