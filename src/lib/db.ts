import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import pg from "pg";

// App runtime database. `DATABASE_URL` points at the pooled (pgbouncer)
// endpoint so the app scales past Neon's direct connection limit.
//
// `keepAlive` matters here: pgbouncer and Neon can close idle server
// connections, and without it the pool hands out a dead socket and the next
// query fails with "terminating connection due to administrator command".
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy `.env.example` to `.env` and fill it in."
  );
}

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Single client across HMR reloads in dev; fresh client per server instance in prod.
export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
