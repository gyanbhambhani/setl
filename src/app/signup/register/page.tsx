import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/supabaseServer";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Create account — Setl" };

export default async function SignupRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; role?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSession();
  const redirectTo = sp.redirect ?? "/profile";
  const role: "renter" | "landlord" | null =
    sp.role === "renter" || sp.role === "landlord" ? sp.role : null;
  if (user) {
    redirect(redirectTo);
  }

  const eyebrow =
    role === "renter"
      ? "Renter signup"
      : role === "landlord"
        ? "Landlord signup"
        : "Setl access";

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
          {eyebrow}
        </p>
        <h1
          className="mt-3 font-display text-[36px] leading-[1.05] tracking-tight
            sm:text-[42px]"
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          Create your account
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
          Email and password. After this, you&rsquo;ll finish a short setup.
        </p>
        <Card className="mt-8">
          <CardContent>
            <SignupForm redirectTo={redirectTo} role={role} />
          </CardContent>
        </Card>
        <p
          className="mt-8 text-center text-[14px] text-muted-foreground"
        >
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
