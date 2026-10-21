# AGENTS.md

Makindye SS — school management system for Makindye Secondary School.
Next.js 16.4.2 (App Router), Better Auth 1.7, Prisma 7 + PostgreSQL 18.

## Commands

- Dev: `npm run dev` (http://localhost:3000)
- Build: `npm run build` · Serve prod: `npm run start`
- Lint: `npm run lint` · Typecheck: `npm run typecheck`
- DB: `npm run db:migrate` · `npm run db:generate` · `npm run db:studio` · `npm run db:seed`
- Regenerate Better Auth models: `npm run db:auth:schema`
- Start the local Postgres cluster: `./scripts/db-start.sh`

Use npm (`package-lock.json` present). Don't edit `next-env.d.ts` (generated,
gitignored). Never edit `src/generated/**` — regenerate instead.

## Structure

- `src/app/layout.tsx` — root layout (Geist fonts, `h-full`/`min-h-full flex flex-col` shell)
- `src/app/page.tsx` — landing page
- `src/app/(auth)/` — sign-in / sign-up screens; `redirect-if-signed-in.tsx` sends signed-in users to `/dashboard`
- `src/app/dashboard/` — protected area; `sign-out-button.tsx` ends the session
- `src/app/api/auth/[...all]/route.ts` — Better Auth route handler (`toNextJsHandler`)
- `src/lib/auth.ts` — Better Auth server config (email + password, `additionalFields`, `nextCookies()`)
- `src/lib/auth-client.ts` — Better Auth React client
- `src/lib/db.ts` — Prisma singleton with the `PrismaPg` driver adapter
- `src/lib/session.ts` — session data access layer (`getCurrentUser`, `requireUser`)
- `src/proxy.ts` — optimistic route protection for `/dashboard/*`
- `prisma/schema.prisma` — Better Auth models (generated) + the `// ---------- Better Auth models ----------` marker
- `scripts/` — `db-start.sh`, `generate-auth-schema.mjs`, `seed.mts`
- Path alias: `@/*` → `./src/*`

## Next.js 16 — this is NOT the Next.js you know

Breaking changes that bite here (details in `node_modules/next/dist/docs/`):

- **`cacheComponents: true` + `partialPrefetching: true`** are on. Data
  fetching is **dynamic by default**. A route that reads uncached data or
  runtime APIs outside a `<Suspense>` boundary fails the build. PPR is the
  default model — `experimental.ppr` is gone.
- **Request APIs are async-only**: `cookies()`, `headers()`, `draftMode()`,
  `params`, `searchParams`. No sync fallback.
- **`middleware` is renamed `proxy`** — file is `src/proxy.ts`, function is
  `proxy`. (Codemod: `npx @next/codemod@canary middleware-to-proxy .`)
- **`redirect()` mid-stream becomes a client-side redirect.** Once a
  `<Suspense>` fallback has flushed, the status is committed to `200` and a
  redirect can only be sent to the client. Don't expect a `3xx`.
- **`typedRoutes: true`** is enabled, so `Link href` is type-checked against
  the route table. Run `npm run typecheck` (which runs `next typegen` first).
- Turbopack is the default bundler for `dev` and `build`. `next build` fails
  if a `webpack` config is present.
- `reactCompiler: true` — no manual `useMemo`/`useCallback` for memoization.

## Auth conventions

- **Session reads go through `src/lib/session.ts`.** Never call
  `auth.api.getSession` directly from a component — that bypasses the
  `isActive` check and the cache scope.
- **`getCurrentUser()` uses `use cache: private`.** A request read can never be
  prerendered; the private scope gives it a client-cache lifetime without
  storing it on the server. Keep `stale` ≥ 30s or the scope drops out of
  prefetching.
- **Anything that reads the session needs a `<Suspense>` boundary.** The
  static shell must be non-empty.
- **`requireUser()` sits outside any cache scope** — `redirect()` throws to
  interrupt rendering, so it must not be inside a cached function.
- **`src/proxy.ts` only checks cookie *presence*.** It is an optimistic
  redirect, not authorisation. Every protected page must still call
  `requireUser()` server-side.
- **Never expose the raw session to a Client Component.** `getCurrentUser()`
  returns a narrowed `{ id, name, email, role }`.
- **Auth models are generated, not hand-edited.** Run
  `npm run db:auth:schema` after changing the Better Auth config. The script
  strips the `server-only` guard (the Better Auth CLI cannot resolve it) and
  restores the files afterwards.
- `BETTER_AUTH_URL` must match the serving origin — Better Auth rejects
  requests from other origins with `INVALID_ORIGIN`.
- `nextCookies()` must stay last in the plugin list.

## Conventions / gotchas

- App Router only. New routes = folders under `src/app/` with `page.tsx`.
- Tailwind v4: CSS-first config (`@import "tailwindcss"` + `@theme inline` in
  `globals.css`). No `tailwind.config.js`. The Turbopack loader is configured
  in `next.config.ts`.
- **Prisma 7 requires a driver adapter** — `new PrismaClient()` bare fails
  type checking. Use `new PrismaClient({ adapter: new PrismaPg(pool) })`.
- The datasource URL lives in `prisma7.config.ts` (not `schema.prisma`), so
  the app runtime and the CLI share one direct, unpooled connection.
- `pg` and `@prisma/adapter-pg` are listed in `serverExternalPackages` — their
  socket/TLS stack breaks when bundled.
- The local PostgreSQL cluster is user-owned (`~/.local/pgdata`) because the
  system service needs root. Start it with `./scripts/db-start.sh`.
- `src/generated/prisma` is gitignored — run `npm run db:generate` after
  cloning.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
