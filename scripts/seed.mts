#!/usr/bin/env node
// Seeds the first administrator.
//
// Usage:
//   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
//
// The password must be at least 12 characters (Better Auth's policy).
// Secrets come from the environment — never hard-code them here.

import { randomUUID } from "node:crypto";

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client.js";

const ROLES = ["admin", "head_teacher", "teacher", "student"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Administrator";
  const role = process.env.SEED_ADMIN_ROLE ?? "admin";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set. See .env.example."
    );
  }

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  if (!isRole(role)) {
    throw new Error(`SEED_ADMIN_ROLE must be one of: ${ROLES.join(", ")}`);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✔ User ${email} already exists — nothing to do.`);
      return;
    }

    const userId = randomUUID();

    await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: true,
        role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        accounts: {
          create: {
            id: randomUUID(),
            // Better Auth stores credential accounts with the user's id as the
            // account id (see better-auth's sign-up route).
            accountId: userId,
            providerId: "credential",
            // Better Auth's own scrypt hash, so the seeded account can sign in
            // through the normal email/password flow.
            password: await hashPassword(password),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });

    console.log(`✔ Seeded ${email} with role "${role}".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
