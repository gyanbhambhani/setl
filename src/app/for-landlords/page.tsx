import Link from "next/link";
import { ArrowRight, Camera, Clock, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "For landlords — Setl",
  description: "List verified student housing in Berkeley on Setl.",
};

const pillars = [
  {
    label: "Human review",
    body: "We check your listing and photos before renters ever see them.",
  },
  {
    label: "Serious renters",
    body:
      "Renters share preferences up front — fewer wasted tours and messages.",
  },
  {
    label: "24-hour promise",
    body:
      "You agree to reply within a day; that keeps your listing prioritized.",
  },
];

const checklist = [
  { icon: ShieldCheck, body: "Unit address, rent, availability, beds & baths" },
  { icon: Camera, body: "Up to 8 photos (50MB each)" },
  { icon: Clock, body: "Agreement to respond within 24 hours" },
];

export default function ForLandlordsLandingPage() {
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
              Landlords
            </Badge>
            <h1
              className="mt-6 font-display text-[44px] leading-[1.04]
                tracking-tight text-foreground sm:text-[64px]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}
            >
              List a place renters{" "}
              <span className="italic text-brand">believe in.</span>
            </h1>
            <p
              className="mt-6 max-w-xl text-[17px] leading-[1.65]
                text-muted-foreground"
            >
              Setl is built for landlords happy to show the real unit and
              respond quickly. Submit photos and details — we review, then
              match you with vetted Berkeley renters.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                render={<Link href="/signup?as=landlord" />}
                nativeButton={false}
              >
                Sign up
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={
                  <Link href="/login?redirect=/for-landlords/onboard" />
                }
                nativeButton={false}
              >
                Sign in
              </Button>
            </div>
          </div>
          <aside className="md:col-span-5">
            <Card className="bg-card p-0">
              <CardContent className="px-7 py-7">
                <p
                  className="font-mono text-[11px] uppercase tracking-[0.22em]
                    text-muted-foreground"
                >
                  What you&rsquo;ll need
                </p>
                <ul className="mt-5 space-y-4">
                  {checklist.map(({ icon: Icon, body }) => (
                    <li key={body} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex size-7 shrink-0
                          items-center justify-center rounded-lg bg-brand-soft
                          text-brand-ink"
                      >
                        <Icon className="size-3.5" strokeWidth={1.75} />
                      </span>
                      <span className="text-[15px] leading-[1.5]">{body}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup?as=landlord"
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
