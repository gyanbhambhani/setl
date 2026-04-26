import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Setl" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSession();
  const redirectTo = sp.redirect ?? "/listings";
  if (user) {
    redirect(redirectTo);
  }

  const signupHref =
    sp.redirect && sp.redirect !== "/listings"
      ? `/signup/register?redirect=${encodeURIComponent(sp.redirect)}`
      : "/signup";

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-20">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          Setl access
        </p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          Use the email and password you chose when you signed up.
        </p>
        <div className="mt-8">
          <LoginForm redirectTo={redirectTo} />
        </div>
        <p className="mt-8 text-center text-[14px] text-muted">
          New here?{" "}
          <Link
            href={signupHref}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
