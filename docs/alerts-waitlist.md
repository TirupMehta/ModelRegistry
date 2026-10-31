# Model Alerts waitlist

The waitlist is a single table, `waitlist_signups`, plus an attempt counter,
`waitlist_rate_limits`. It is deliberately not a subscription system: there are
no notification preferences, verification tokens, or delivery tables yet.

## Environment variables

Required in Vercel and locally (see `.env.example`):

- `DATABASE_URL` - pooled Neon connection string
- `DATABASE_URL_UNPOOLED` - direct Neon connection string
- `NEON_BRANCH` - branch name (optional, for logging only)

Optional:

- `WAITLIST_HASH_SECRET` - HMAC secret for rate-limit keys
- `WAITLIST_RATE_LIMIT_MAX` - attempts per window (default 10)
- `WAITLIST_RATE_LIMIT_WINDOW_SECONDS` - window length (default 600)

`DATABASE_URL_UNPOOLED` is preferred for migrations; the app itself uses
`DATABASE_URL`.

## Migrations

Generate SQL after changing `lib/db/schema.ts`:

```sh
pnpm db:generate
```

Apply pending migrations (reads `.env.local`, then `.env`):

```sh
pnpm db:migrate
```

Inspect the database:

```sh
pnpm db:studio
```

Migrations live in `drizzle/` and are version controlled. Never create tables
through the Neon dashboard.

## Vercel region

The Neon branch is in `aws-ap-southeast-1` (Singapore). The repository ships
no `vercel.json`, so Vercel runs functions in its default region. To keep the
waitlist endpoint close to the database, set the project's function region to
`sin1` in the Vercel dashboard, or add a `vercel.json` with:

```json
{ "regions": ["sin1"] }
```

No existing page or API route depends on a specific region today, so this is a
low-risk change, but it is a deployment decision and should be confirmed before
shipping.
