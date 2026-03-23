# MM Exam Studio Server

## Dev

```bash
bun install
bun --watch run src/index.ts
```

Server default URL:

```txt
http://localhost:3000
```

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

## Current Payment Model

Payment gateway is not used yet. Production flow is manual:

- user submits plan request
- user adds transaction ID
- user uploads payment proof image
- admin approves or rejects

Payment proof images are currently stored inline in the database as `data:image/...` payloads.
That is acceptable for the current manual-review flow with strict size limits, but it is not the
right long-term shape for high-volume uploads. If payment proof traffic grows, move proofs to
object storage such as R2 or S3 and store only URLs/metadata in the database.

## Subscription Payment Config

The subscription module exposes a config payload to the mobile app so payment instructions can be
changed without shipping a new client build.

Recommended environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `SUBSCRIPTION_PAYMENT_CHANNEL_NAME` | Payment channel label shown to users. Example: `KBZPay` | empty |
| `SUBSCRIPTION_PAYMENT_ACCOUNT_NAME` | Receiver account or business name | empty |
| `SUBSCRIPTION_PAYMENT_ACCOUNT_REFERENCE` | Wallet number, account number, or reference string | empty |
| `SUBSCRIPTION_PAYMENT_URL` | Optional deep link or web URL that opens the payment channel from the app | empty |
| `SUBSCRIPTION_PAYMENT_INSTRUCTIONS` | Multi-line payment instructions shown in app | built-in generic instructions |
| `SUBSCRIPTION_SUPPORT_LABEL` | Support label shown in app | `Support` |
| `SUBSCRIPTION_SUPPORT_CONTACT` | Support phone, Viber, Telegram, etc. | falls back to `SUBSCRIPTION_SUPPORT_EMAIL` |
| `SUBSCRIPTION_SUPPORT_URL` | Optional deep link or web URL for support chat/contact | empty |
| `SUBSCRIPTION_SUPPORT_EMAIL` | Support email fallback | empty |
| `SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES` | Max decoded image size accepted for payment proof | `1500000` |
| `SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES` | Max request payload size for subscription create route | `2700000` |

Example:

```bash
SUBSCRIPTION_PAYMENT_CHANNEL_NAME=KBZPay
SUBSCRIPTION_PAYMENT_ACCOUNT_NAME=MM Exam Studio
SUBSCRIPTION_PAYMENT_ACCOUNT_REFERENCE=09xxxxxxxxx
SUBSCRIPTION_PAYMENT_URL=https://t.me/mmexamstudio_pay
SUBSCRIPTION_PAYMENT_INSTRUCTIONS="Send payment, keep your screenshot, then submit transaction ID and proof image."
SUBSCRIPTION_SUPPORT_LABEL=Telegram
SUBSCRIPTION_SUPPORT_CONTACT=@mmexamstudio
SUBSCRIPTION_SUPPORT_URL=https://t.me/mmexamstudio
SUBSCRIPTION_PAYMENT_PROOF_MAX_BYTES=1500000
SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES=2700000
```

## Drizzle Migration Notes

- `drizzle/` now contains the checked-in SQL baseline generated from the current schema.
- `db:migrate` is for fresh environments.
- `db:push` is the safer command for an existing production database that already has tables/data.
- After `db:push`, deploy the API so runtime code and DB schema stay in sync.
