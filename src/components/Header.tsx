import Link from "next/link";
import { getSession } from "@/lib/supabaseServer";

export async function Header() {
  let user: Awaited<ReturnType<typeof getSession>> = null;
  try {
    user = await getSession();
  } catch {
    user = null;
  }
  return (
    <header className="border-b border-hairline">
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between
          px-6 py-5"
      >
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">
            Setl
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-foreground/70">
          <Link
            href="/for-renters"
            className="transition-colors hover:text-foreground"
          >
            For renters
          </Link>
          <Link
            href="/for-landlords"
            className="transition-colors hover:text-foreground"
          >
            For landlords
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground"
                title={user.email ?? "Signed in"}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="transition-colors hover:text-foreground"
                title={user.email ?? "Signed in"}
              >
                Profile
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-foreground/70 transition-colors
                    hover:text-foreground"
                  title={user.email ?? "Signed in"}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-hairline px-3.5 py-1.5
                  text-sm transition-colors hover:border-foreground/30"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium
                  text-[#fafaf8] transition-colors hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-lg " +
        "bg-accent text-[#fafaf8] " +
        (className ?? "")
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
