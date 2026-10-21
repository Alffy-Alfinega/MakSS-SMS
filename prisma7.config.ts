// Prisma ORM 7 configuration for Makindye SS.
//
// Migrations run against the DIRECT (unpooled) endpoint — schema DDL and
// the shadow database need a real session, which pgbouncer's transaction
// pooler cannot provide. The app runtime uses the pooled DATABASE_URL.
//
// Both come from the environment, so local development can point at a local
// cluster by setting DATABASE_URL alone.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const unpooledUrl =
  process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"];

if (!unpooledUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy `.env.example` to `.env` and fill it in."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed.mts",
  },
  datasource: {
    url: unpooledUrl,
  },
});
