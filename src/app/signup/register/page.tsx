import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Create account — Setl" };

export default async function SignupRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSession();
  const redirectTo = sp.redirect ?? "/profile";
  if (user) {
    redirect(redirectTo);
  }

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
          Create your account
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          Email and password. After this you&rsquo;ll finish a short setup step.
        </p>
        <div className="mt-8">
          <SignupForm redirectTo={redirectTo} />
        </div>
        <p className="mt-8 text-center text-[14px] text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
