import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";

// Better Auth owns the auth tables (User/Session/Account/Verification).
// Schema is generated with: npx @better-auth/cli@latest generate
export const auth = betterAuth({
  appName: "Makindye SS",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      // Authorisation role. Seeded to "student"; promoted by an admin action.
      role: { type: "string", required: false, defaultValue: "student" },
      // Soft-disable switch — an inactive user can still sign in to the auth
      // layer, so every authorisation check must reject them.
      isActive: { type: "boolean", required: false, defaultValue: true },
      phone: { type: "string", required: false },
    },
  },
  // Lets Server Actions set cookies (Better Auth cannot set them from an RSC).
  // Must stay last in the plugin list.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
