# MM Exam Studio User App

## Dev

Install dependencies from the repository root, then run the client workspace:

```bash
bun install
bun run dev:client
```

The local development environment uses `client/.env.development.local` and points to the local Bun API.

## Build and deploy

Vite embeds `VITE_*` variables into the browser bundle at build time. Production values must be present before running the Cloudflare Pages deploy command.

Copy the production example to a local production file:

```bash
cp .env.production.example .env.production.local
```

PowerShell:

```powershell
Copy-Item .env.production.example .env.production.local
```

The production file should contain:

```env
VITE_SERVER_URL=https://examapi.hsuwai.space
VITE_CLIENT_URL=https://examstudio.hsuwai.space
VITE_APP_URL=https://examstudio.hsuwai.space
```

Then deploy from the repository root while checked out to the production branch:

```bash
bun run cf:deploy:client
```

Do not keep localhost values in `client/.env.local`. Vite loads `.env.local` for every mode, so it can override `.env.production` during a production build. Use `.env.development.local` for localhost and `.env.production.local` for production instead. These local files are ignored by Git and must never contain secrets.

## Env reference

- `VITE_SERVER_URL`: API origin used by the browser client
- `VITE_CLIENT_URL`: public client origin used for auth callback URLs
- `VITE_APP_URL`: public client application URL

## Main Flows

- Practice
- Question paper builder
- Question swap / replace / reorder
- Finalize and PDF export
- Branding
- Open access for core study and paper tools
