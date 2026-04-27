import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
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
  const redirectTo = sp.redirect ?? "/dashboard";
  if (user) {
    redirect(redirectTo);
  }

  const signupHref =
    sp.redirect && sp.redirect !== "/dashboard"
      ? `/signup/register?redirect=${encodeURIComponent(sp.redirect)}`
      : "/signup";

  return (
    <>
      <Header />
      <main
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-16
          sm:py-20"
      >
        <p
          className="font-mono text-[11px] uppercase tracking-[0.22em]
            text-muted-foreground"
        >
          Setl access
        </p>
        <h1
          className="mt-3 font-display text-[36px] leading-[1.05] tracking-tight
            sm:text-[42px]"
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          Welcome back
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
          Sign in to keep matching with verified Berkeley housing.
        </p>
        <Card className="mt-8">
          <CardContent>
            <LoginForm redirectTo={redirectTo} />
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-[14px] text-muted-foreground">
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
