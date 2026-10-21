"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm underline underline-offset-4"
    >
      Sign out
    </button>
  );
}
