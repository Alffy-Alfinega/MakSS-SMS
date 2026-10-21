import { NextResponse, type NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic route protection.
 *
 * This only checks that a session cookie is *present* — it does not validate
 * it. That is intentional: a cookie check is cheap and needs no database
 * round-trip, so it can redirect before the page renders. Every protected
 * page must still authorise the request server-side (see `requireUser`).
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
