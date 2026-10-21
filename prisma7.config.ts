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

function resolveUrl(): string {
  const url =
    process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"];

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy `.env.example` to `.env` and fill it in."
    );
  }

  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed.mts",
  },
  datasource: {
    // Resolved lazily: `prisma generate` must work without a database URL
    // (it only reads the schema), while commands that need the database
    // still fail with a clear message.
    get url() {
      return resolveUrl();
    },
  },
});
