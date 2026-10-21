# Makindye SS — School Management System

Web application for Makindye Secondary School. Next.js 16 (App Router) with
Better Auth and a direct PostgreSQL connection.

## Stack

| Concern     | Choice                                              |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 16.4.2 (App Router, Turbopack, Cache Components) |
| Runtime     | React 19.3, Node 20.9+                              |
| Language    | TypeScript (strict)                                 |
| Styling     | Tailwind CSS v4 (CSS-first config)                  |
| Auth        | Better Auth 1.7 (email + password)                  |
| Database    | Neon PostgreSQL 18, pooled endpoint + direct endpoint |
| ORM         | Prisma 7 with the `pg` driver adapter               |

## Getting started

### 1. Environment

```bash
cp .env.example .env
```

Fill in the Neon connection strings. Then set `BETTER_AUTH_SECRET` to a
fresh 32-byte hex string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`BETTER_AUTH_URL` must match the origin the app is served from — Better Auth
rejects requests from other origins with `INVALID_ORIGIN`.

### 2. Install and set up the database

```bash
npm install
npm run db:deploy      # applies migrations to Neon (direct endpoint)
npm run db:generate    # generates Prisma Client into src/generated/prisma
```

### 3. Seed the first administrator

```bash
SEED_ADMIN_EMAIL=you@school.test \
SEED_ADMIN_PASSWORD="at-least-12-characters" \
SEED_ADMIN_NAME="Principal" \
SEED_ADMIN_ROLE=admin \
npm run db:seed
```

### 4. Run

```bash
npm run dev    # http://localhost:3000
```

### Local PostgreSQL (optional fallback)

Neon is the database of record, but a local cluster is available for offline
work. `./scripts/db-start.sh` starts a user-owned PostgreSQL 18 cluster in
`~/.local/pgdata` and creates the `makss` role and `makss_sms` database. The
system service needs root, so this runs its own cluster instead.

To use it, point `DATABASE_URL` at `postgresql://makss:makss_local_dev@127.0.0.1:5432/makss_sms`
and leave `DATABASE_URL_UNPOOLED` unset — the Prisma config falls back to
`DATABASE_URL` for migrations.

## The two connection strings

Neon exposes the same database through two endpoints, and the project uses
each one for the job it can actually do:

| Variable                | Endpoint     | Used by                        |
| ----------------------- | ------------ | ------------------------------ |
| `DATABASE_URL`          | Pooled (pgbouncer) | The app runtime           |
| `DATABASE_URL_UNPOOLED` | Direct       | Prisma migrations and the CLI  |

Migrations need a direct connection: schema DDL and the migration engine's
shadow database require a real session, which pgbouncer's transaction pooler
cannot provide. The app runtime goes through the pooler so it scales past
Neon's direct connection limit.

`sslmode=verify-full` is explicit on purpose. `pg-connection-string` v2
treats `sslmode=require` as an alias for `verify-full`, but pg v9 adopts
libpq semantics where `require` does **not** verify the server certificate.

## Deploying to Vercel

The Prisma Client is generated into `src/generated/prisma`, which is
gitignored — so the build has to generate it. Two hooks make that reliable:

- `postinstall: prisma generate` — the client is fresh after every install.
- `build: prisma generate && next build` — the build regenerates before
  Turbopack starts, in case install scripts were skipped.

`prisma` is a **dependency**, not a devDependency, so it is still present when
Vercel installs with `NODE_ENV=production`.

`prisma generate` reads only the schema, so it works without a database URL.
`next build` does need `DATABASE_URL` — `src/lib/db.ts` throws at import time
if it is missing, and the build fails with that message. Set it in Vercel.

### Environment variables

Set these in **Project Settings → Environment Variables**:

| Variable                | Scope            | Required | Notes                                              |
| ----------------------- | ---------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL`          | All              | Yes      | Neon pooled endpoint — the app runtime             |
| `DATABASE_URL_UNPOOLED` | All              | No       | Neon direct endpoint — only needed to run migrations |
| `BETTER_AUTH_SECRET`    | All              | Yes      | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BETTER_AUTH_URL`       | All              | Yes      | The production origin, e.g. `https://your-app.vercel.app` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Preview  | No       | e.g. `https://*.vercel.app` for preview deployments |

`BETTER_AUTH_URL` must match the origin the app is served from — Better Auth
rejects requests from other origins with `INVALID_ORIGIN`. Preview
deployments get a different origin each time, so add them to
`BETTER_AUTH_TRUSTED_ORIGINS` (glob patterns are supported).

### Applying migrations to Neon

Migrations are not run by the Vercel build. Apply them from your machine
against the direct endpoint:

```bash
npm run db:deploy
```

## Commands

| Command                  | What it does                                        |
| ------------------------ | --------------------------------------------------- |
| `npm run dev`            | Dev server (Turbopack)                              |
| `npm run build`          | Production build                                    |
| `npm run start`          | Serve the production build                          |
| `npm run lint`           | ESLint (flat config)                                |
| `npm run typecheck`      | `next typegen` + `tsc --noEmit`                     |
| `npm run db:migrate`     | Create + apply a migration                          |
| `npm run db:deploy`      | Apply pending migrations (production, Neon)        |
| `npm run db:generate`    | Regenerate Prisma Client                            |
| `npm run db:studio`      | Prisma Studio                                       |
| `npm run db:seed`        | Seed the first administrator                        |
| `npm run db:auth:schema` | Regenerate the Better Auth models in the schema     |

## Authentication

Better Auth owns the auth tables. The schema is **generated**, not hand-written:

```bash
npm run db:auth:schema   # regenerate + merge into prisma/schema.prisma
```

The script (`scripts/generate-auth-schema.mjs`) temporarily strips the
`server-only` guard that the Better Auth CLI cannot resolve, then restores it.

### How a session is read

`cacheComponents` is enabled, so data fetching is dynamic by default and every
route must produce a non-empty static shell.

- `src/lib/session.ts` holds the data access layer. `getCurrentUser()` reads
  the session inside a `use cache: private` scope — a request read can never
  be prerendered, and the private scope gives it a client-cache lifetime
  without storing it on the server.
- Every component that reads the session sits behind a `<Suspense>` boundary,
  so the static shell ships immediately and the session content streams in.
- `redirect()` mid-stream becomes a client-side redirect (the HTTP status is
  already committed to `200`), so the signed-in redirect away from
  `/sign-in` happens in the browser.
- `src/proxy.ts` optimistically redirects `/dashboard/*` when no session
  cookie is present. This is a cookie-presence check only — it does not
  validate the session. Every protected page still authorises server-side via
  `requireUser()`.

### Authorisation

`User.role` is a string, seeded to `"student"`. Current roles:

| Role           | Notes                                    |
| -------------- | ---------------------------------------- |
| `admin`        | Full access                              |
| `head_teacher` | School leadership                        |
| `teacher`      | Teaching staff                           |
| `student`      | Default for self-registered accounts     |

`User.isActive` is the soft-disable switch. `getCurrentUser()` returns `null`
for an inactive user, so every protected route rejects them.

## Layout

```
src/
├── app/
│   ├── (auth)/            # Sign-in / sign-up screens
│   │   ├── layout.tsx
│   │   ├── redirect-if-signed-in.tsx
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── api/auth/[...all]/ # Better Auth route handler
│   ├── dashboard/         # Protected area
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts            # Better Auth server config
│   ├── auth-client.ts     # Better Auth client (React)
│   ├── db.ts              # Prisma client singleton
│   └── session.ts         # Session data access layer
└── proxy.ts               # Route protection (Next 16 renamed middleware)
prisma/
├── migrations/
└── schema.prisma
scripts/
├── db-start.sh            # Start the local PostgreSQL cluster
├── generate-auth-schema.mjs
└── seed.mts
```

## Notes

- **Next.js 16 renamed `middleware` to `proxy`.** The file is `src/proxy.ts`
  and exports a `proxy` function.
- **Request APIs are async-only.** `cookies()`, `headers()`, `draftMode()`,
  `params`, and `searchParams` have no synchronous fallback.
- **Prisma 7 requires a driver adapter.** `new PrismaClient()` without one
  fails type checking; use the `PrismaPg` adapter in `src/lib/db.ts`.
- **`src/generated/prisma` is gitignored.** Run `npm run db:generate` after
  cloning.
- Never edit `src/generated/**` — regenerate instead.
