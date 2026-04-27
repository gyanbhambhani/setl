import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

const props = [
  {
    label: "Verified listings",
    body:
      "Every landlord is hand-reviewed before a single renter sees a place.",
  },
  {
    label: "Real photos",
    body:
      "Landlord-submitted photos reviewed by us. No stock imagery or " +
      "bait-and-switch listings.",
  },
  {
    label: "24-hour response",
    body:
      "Landlords agree to reply within a day. If they don't, we deprioritize" +
      " their listing.",
  },
];

export default async function HomePage() {
  const count = await getWaitlistCount();
  return (
    <>
      <Header />
      <main className="grain relative flex-1">
        <section
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-6
            pt-16 pb-20 md:grid-cols-12 md:gap-x-10 md:pt-24"
        >
          <div className="md:col-span-7 md:pr-6">
            <Badge
              variant="outline"
              className="rounded-full bg-card font-mono text-[10px] uppercase
                tracking-[0.22em] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-brand" />
              By Berkeley, for Berkeley
            </Badge>
            <h1
              className="mt-6 font-display text-[48px] leading-[1.02]
                tracking-tight text-foreground sm:text-[72px]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}
            >
              Find a home you can{" "}
              <span className="italic text-brand">actually trust.</span>
              <span
                className="mt-4 block font-sans text-[20px] font-normal
                  not-italic tracking-normal text-muted-foreground sm:text-[22px]"
              >
                By Berkeley.
              </span>
            </h1>
            <p
              className="mt-6 max-w-xl text-[17px] leading-[1.65]
                text-muted-foreground"
            >
              Setl is verified student housing in Berkeley. Every listing is a
              real place, with real photos, from a landlord we&rsquo;ve spoken
              to.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/for-renters" />}
                nativeButton={false}
              >
                I&rsquo;m looking
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/for-landlords" />}
                nativeButton={false}
              >
                I have a place
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
                    Berkeley renters on the waitlist
                  </>
                ) : (
                  <>Trusted by Berkeley renters and landlords</>
                )}
              </span>
            </div>
            <p
              className="mt-6 text-[13px] text-muted-foreground"
            >
              Setl is built inside{" "}
              <a
                href="https://mano.network"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                mano.network
              </a>
              , a small studio of tools we wish existed.
            </p>
          </div>

          <aside className="md:col-span-5">
            <Card className="overflow-hidden p-0 ring-foreground/15">
              <FakeListingPreview />
            </Card>
          </aside>
        </section>

        <Separator />

        <section>
          <div
            className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-y-10 px-6
              py-16 md:grid-cols-3 md:gap-x-10"
          >
            {props.map((p, i) => (
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

function FakeListingPreview() {
  return (
    <div className="aspect-[4/5] flex flex-col">
      <div className="relative flex-1 bg-[#1a1a1a]">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 30%, #5c7a5c 0%," +
              " #1a1a1a 60%)",
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center
            text-[#fafaf8]/80"
        >
          <span
            className="flex size-14 items-center justify-center rounded-full
              border border-[#fafaf8]/40 bg-black/30 backdrop-blur-sm"
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5
            rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px]
            uppercase tracking-[0.22em] text-[#fafaf8] backdrop-blur-sm"
        >
          <ShieldCheck className="size-3" />
          Verified
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex items-baseline justify-between">
          <h4
            className="font-display text-[18px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            2BR · Southside cottage
          </h4>
          <span className="text-[15px] font-medium">$2,850</span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Sunny corner unit, two blocks from campus, washer in unit.
        </p>
      </div>
    </div>
  );
}
