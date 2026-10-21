// Prisma ORM 7 configuration for Makindye SS.
//
// The datasource URL lives here (not in schema.prisma) so the app runtime and
// the CLI share one direct, unpooled PostgreSQL connection.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed.mts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
