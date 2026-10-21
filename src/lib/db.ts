import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import pg from "pg";

// Direct PostgreSQL connection over the standard wire protocol (no pooler).
// `pg.Pool` here is a local socket pool, not a network pooler — the same URL
// works for the app runtime and for Prisma migrations, so there is no
// DATABASE_URL/DIRECT_URL split to keep in sync.
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
  connectionTimeoutMillis: 10_000,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Single client across HMR reloads in dev; fresh client per server instance in prod.
export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
