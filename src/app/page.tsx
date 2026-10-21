import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/[.08] dark:border-white/[.12]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">Makindye SS</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
            <Link href="/sign-up" className="underline underline-offset-4">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-32">
        <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
          School management for Makindye Secondary School.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Students, staff, attendance, and results — one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-solid border-black/[.08] px-5 py-3 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
