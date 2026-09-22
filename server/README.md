# MM Exam Studio Server

## Dev

```bash
bun install
cp .env.example .env
bun --watch run src/index.ts
```

Server default URL:

```txt
http://localhost:3000
```

Local defaults:

- `server/.env.example` and `server/.env` now include a ready-to-run local setup.
- Default local Postgres URL is `postgresql://neon:neon@localhost:5432/postgres`.
- Password reset and email verification links are logged in development when no email provider is configured.

## Build

```bash
bun run build
```

## Database

```bash
bun run seed
```

Use Drizzle as the source of truth for schema changes.

For an existing database that already has app tables:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:push
```

For a fresh database from scratch:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:migrate
```

For future schema edits:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:generate
```

If you want the quickest existing-DB sync + seed flow:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:push:seed
```

For a fresh DB bootstrap + seed:

```bash
cd /home/hsuwai/Documents/mm-exam-studio/server
npm run db:migrate:seed
```

## Important Modules

- `questions`
- `taxonomy`
- `workspace`
- `subscriptions`
- `auth`

## Open-source access model

The default configuration is open access. Learners can use core practice, paper-building,
branding, and PDF-export tools without subscription tiers or payment approval.

Keep `OPEN_SOURCE_MODE=true` in the server environment. Existing subscription tables remain in
the schema for backward compatibility with older installations, but they do not restrict access in
open-source mode.

## Drizzle Migration Notes

- `drizzle/` now contains the checked-in SQL baseline generated from the current schema.
- `db:migrate` is for fresh environments.
- `db:push` is the safer command for an existing production database that already has tables/data.
- After `db:push`, deploy the API so runtime code and DB schema stay in sync.
