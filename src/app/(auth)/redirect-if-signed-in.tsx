import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

/**
 * Sends an already-signed-in visitor away from the auth screens.
 *
 * Reads the session at request time, so it lives behind a `<Suspense>`
 * boundary in the page. The redirect happens as the boundary resolves.
 */
export default async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return null;
}
