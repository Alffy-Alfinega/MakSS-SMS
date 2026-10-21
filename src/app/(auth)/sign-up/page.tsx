import { Suspense } from "react";

import { SignUpForm } from "./sign-up-form";
import RedirectIfSignedIn from "../redirect-if-signed-in";

export default function SignUpPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Register for a Makindye SS account.
      </p>

      <SignUpForm />
    </>
  );
}
