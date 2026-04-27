import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata = {
  title: "For renters — Setl",
  description: "Verified student housing in Berkeley for renters.",
};

export const dynamic = "force-dynamic";

async function getWaitlistCount(): Promise<number | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { count } = await supabase
      .from("renters")
      .select("id", { head: true, count: "exact" });
    return count ?? 0;
  } catch {
    return null;
  }
}

const pillars = [
  {
    label: "Verified only",
    body: "Every landlord and listing is reviewed before you ever swipe.",
  },
  {
    label: "Real photos",
    body:
      "No bait-and-switch stock imagery — what you see is what we approved.",
  },
  {
    label: "24-hour replies",
    body:
      "Landlords commit to answering interest fast, or we deprioritize them.",
  },
];

export default async function ForRentersLandingPage() {
  const count = await getWaitlistCount();

  return (
    <>
      <Header />
      <main className="grain relative flex-1">
        <section
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-6
            pt-16 pb-20 md:grid-cols-12 md:gap-x-10 md:pt-24"
        >
          <div className="md:col-span-7 md:pr-8">
            <Badge
              variant="outline"
              className="rounded-full bg-card font-mono text-[10px] uppercase
                tracking-[0.22em] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-brand" />
              Renters
            </Badge>
            <h1
              className="mt-6 font-display text-[44px] leading-[1.04]
                tracking-tight text-foreground sm:text-[64px]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}
            >
              A Berkeley home you can{" "}
              <span className="italic text-brand">actually trust.</span>
            </h1>
            <p
              className="mt-6 max-w-xl text-[17px] leading-[1.65]
                text-muted-foreground"
            >
              Setl matches you with hand-verified places near campus. Tell us
              your budget and dealbreakers once — then swipe listings that are
              already vetted.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                render={<Link href="/signup?as=renter" />}
                nativeButton={false}
              >
                Sign up
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={
                  <Link href="/login?redirect=/for-renters/onboard" />
                }
                nativeButton={false}
              >
                Sign in
              </Button>
            </div>
            <div
              className="mt-10 flex items-center gap-4 text-[13px]
                text-muted-foreground"
            >
              <div className="flex -space-x-2">
                {["#cdd9c5", "#e4c8a3", "#bcc6d3"].map((c) => (
                  <span
                    key={c}
                    className="size-7 rounded-full border-2 border-background"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span>
                {typeof count === "number" ? (
                  <>
                    <strong className="text-foreground">{count}</strong>{" "}
                    renters on the waitlist
                  </>
                ) : (
                  <>Join Berkeley renters on Setl</>
                )}
              </span>
            </div>
          </div>
          <aside className="md:col-span-5">
            <Card className="bg-card p-0">
              <CardContent className="px-7 py-7">
                <p
                  className="font-mono text-[11px] uppercase tracking-[0.22em]
                    text-muted-foreground"
                >
                  After you sign in
                </p>
                <ol className="mt-5 space-y-4 text-[15px] leading-[1.55]">
                  <Step
                    n={1}
                    title="Set your preferences"
                    body="Budget, move date, neighborhoods, and dealbreakers."
                  />
                  <Step
                    n={2}
                    title="Swipe verified listings"
                    body="Right to save, left to pass."
                  />
                  <Step
                    n={3}
                    title="Get matched"
                    body="We email you when there's a fit worth an intro."
                  />
                </ol>
                <Link
                  href="/signup?as=renter"
                  className="mt-7 inline-flex items-center gap-1.5 text-[14px]
                    font-medium text-brand-ink underline-offset-4
                    hover:underline"
                >
                  Create an account
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </aside>
        </section>

        <Separator />

        <section>
          <div
            className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-y-10 px-6
              py-16 md:grid-cols-3 md:gap-x-10"
          >
            {pillars.map((p, i) => (
              <div key={p.label} className="flex flex-col gap-3">
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.24em]
                    text-muted-foreground"
                >
                  0{i + 1}
                </span>
                <h3
                  className="font-display text-[22px] leading-[1.2]
                    tracking-tight"
                >
                  {p.label}
                </h3>
                <p className="text-[15px] leading-[1.6] text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 inline-flex size-6 shrink-0 items-center
          justify-center rounded-full bg-brand-soft font-mono text-[11px]
          font-semibold text-brand-ink"
      >
        {n}
      </span>
      <span>
        <strong className="font-medium text-foreground">{title}.</strong>{" "}
        <span className="text-muted-foreground">{body}</span>
      </span>
    </li>
  );
}
