import { Suspense } from "react";

import { SignInForm } from "./sign-in-form";
import RedirectIfSignedIn from "../redirect-if-signed-in";

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Sign in to your Makindye SS account.
      </p>

      <SignInForm />
    </>
  );
}
