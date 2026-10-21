import { Suspense } from "react";

import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/[.08] dark:border-white/[.12]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">Makindye SS</span>
          <Suspense fallback={null}>
            <SignOutSlot />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading…</p>}>
          <DashboardGreeting />
        </Suspense>
      </main>
    </div>
  );
}

async function SignOutSlot() {
  await requireUser();
  return <SignOutButton />;
}

async function DashboardGreeting() {
  const user = await requireUser();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as {user.email} · role: {user.role}
      </p>
    </div>
  );
}
