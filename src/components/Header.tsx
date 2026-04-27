import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SetlWordmark } from "@/components/SetlLogo";
import { getTotalUnreadForUser } from "@/lib/messaging/conversations";
import { getSession } from "@/lib/supabaseServer";

export async function Header() {
  let user: Awaited<ReturnType<typeof getSession>> = null;
  try {
    user = await getSession();
  } catch {
    user = null;
  }
  const logoHref = "/";
  let unread = 0;
  if (user) {
    try {
      unread = await getTotalUnreadForUser(user.id);
    } catch {
      unread = 0;
    }
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/70
        bg-background/80 backdrop-blur"
    >
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between
          gap-6 px-6 py-4"
      >
        <Link
          href={logoHref}
          className="group inline-flex items-center"
          aria-label="Setl home"
        >
          <SetlWordmark className="text-[26px]" />
        </Link>
        <nav
          className="flex items-center gap-1 text-sm"
          aria-label="Primary"
        >
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link
                    href="/messages"
                    title={
                      unread > 0
                        ? `${unread} unread message${unread === 1 ? "" : "s"}`
                        : "Messages"
                    }
                  />
                }
                nativeButton={false}
              >
                <span className="relative inline-flex items-center">
                  Messages
                  {unread > 0 ? (
                    <span
                      aria-hidden
                      className="absolute -right-2 -top-1 inline-block size-2
                        rounded-full bg-brand"
                    />
                  ) : null}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link
                    href="/dashboard"
                    title={user.email ?? "Signed in"}
                  />
                }
                nativeButton={false}
              >
                Dashboard
              </Button>
              <form action="/api/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  title={user.email ?? "Signed in"}
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/for-renters" />}
                nativeButton={false}
              >
                For renters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/for-landlords" />}
                nativeButton={false}
              >
                For landlords
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="ml-1"
                render={<Link href="/signup" />}
                nativeButton={false}
              >
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
