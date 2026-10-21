import "server-only";

import { headers } from "next/headers";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * The signed-in user's identity, narrowed to what the UI actually needs.
 * Never hand the raw session to a Client Component — it carries the session
 * token and expiry.
 */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * How long the client router may reuse rendered session UI.
 *
 * 300s keeps the scope eligible for the route's App Shell, so authenticated
 * navigations render instantly. The shell is cached per session, never
 * shared across users.
 */
const SESSION_STALE = 300;

/**
 * Reads the session cookie and validates the token against its expiry.
 *
 * Not cached itself: it reads request state, so it can only ever run at
 * request time. Callers wrap it in a cache scope.
 */
async function readSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * The full session, or `null` when signed out.
 */
export async function getSession() {
  "use cache: private";
  cacheLife({ stale: SESSION_STALE });

  return readSession();
}

/**
 * The current user, or `null` when signed out or deactivated.
 *
 * Centralising the read here means every caller agrees on what "signed in"
 * means — including the `isActive` check, which the auth layer alone does
 * not enforce.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  "use cache: private";
  cacheLife({ stale: SESSION_STALE });

  const session = await readSession();
  if (!session) return null;

  const { user } = session;
  if (user.isActive === false) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "student",
  };
}

/**
 * The current user, or a redirect to the sign-in page.
 *
 * `redirect()` throws to interrupt rendering rather than returning a value,
 * so this helper deliberately sits outside any cache scope.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
