import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Calendar,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
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
          <div className="md:col-span-6 lg:col-span-7 md:pr-6">
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
          </div>

          <aside className="md:col-span-6 lg:col-span-5">
            <Card
              className="overflow-hidden p-0 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.35)]
                ring-1 ring-foreground/10 md:translate-y-1"
            >
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

const HERO_LISTING_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7" +
  "?auto=format&fit=crop&w=1400&q=85";

function FakeListingPreview() {
  return (
    <div className="flex flex-col">
      {/* Tall hero photo — real interior so the card reads as a listing, not
          a wireframe. */}
      <div
        className="relative aspect-3/4 min-h-[min(72vh,520px)] w-full
          overflow-hidden bg-muted sm:min-h-[560px]"
      >
        <Image
          src={HERO_LISTING_IMAGE}
          alt="Sunlit living room with sofa, plants, and large windows"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t
            from-black/70 via-black/10 to-black/30"
        />
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5
            rounded-full bg-black/50 px-3 py-1.5 font-mono text-[10px]
            uppercase tracking-[0.22em] text-white backdrop-blur-md"
        >
          <ShieldCheck className="size-3.5" />
          Verified
        </span>
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1.5
            rounded-full bg-brand px-3 py-1.5 font-mono text-[10px]
            uppercase tracking-[0.22em] text-brand-foreground shadow-lg"
        >
          <Sparkles className="size-3.5" />
          92% match
        </span>
        <div
          className="absolute bottom-4 left-4 right-4 flex items-end
            justify-between gap-3"
        >
          <div className="min-w-0">
            <p
              className="truncate font-display text-[26px] leading-[1.1]
                tracking-tight text-white drop-shadow-md sm:text-[30px]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              Cedar &amp; Shattuck
            </p>
            <p
              className="mt-1 inline-flex items-center gap-1.5 text-[13px]
                text-white/85"
            >
              <MapPin className="size-3.5 shrink-0" />
              Northside · 6 min walk to campus
            </p>
          </div>
          <div className="shrink-0 text-right text-white drop-shadow-md">
            <p
              className="font-display text-[28px] leading-none tracking-tight
                sm:text-[32px]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              $2,850
            </p>
            <p
              className="mt-1 font-mono text-[10px] uppercase
                tracking-[0.22em] text-white/70"
            >
              per month
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 sm:py-7">
        {/* Stats as a single horizontal row — avoids the empty “stat box” look */}
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b
            border-border pb-5 text-[15px]"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <BedDouble className="size-4 text-muted-foreground" />
            2 bedrooms
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2 font-medium">
            <Bath className="size-4 text-muted-foreground" />
            1 bath
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2 font-medium">
            <Calendar className="size-4 text-muted-foreground" />
            Available Aug 15
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-2.5 py-0.5 text-[13px]">
            In-unit laundry
          </Badge>
          <Badge variant="outline" className="px-2.5 py-0.5 text-[13px]">
            Hardwood
          </Badge>
          <Badge variant="outline" className="px-2.5 py-0.5 text-[13px]">
            South-facing
          </Badge>
          <Badge variant="outline" className="px-2.5 py-0.5 text-[13px]">
            Pets ok
          </Badge>
        </div>

        <p
          className="border-l-[3px] border-brand/70 pl-4 text-[15px] italic
            leading-relaxed text-muted-foreground"
        >
          &ldquo;Top floor of a 1920s brown shingle. Quiet block, big kitchen,
          replies in the same day.&rdquo;
        </p>

        <div
          className="flex items-center justify-between gap-4 border-t
            border-dashed border-border pt-5"
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]
              text-muted-foreground"
          >
            Swipe to decide
          </span>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-11 items-center justify-center
                rounded-full border-2 border-border bg-background
                text-muted-foreground shadow-sm"
              aria-hidden
            >
              <X className="size-4" />
            </span>
            <span
              className="inline-flex size-11 items-center justify-center
                rounded-full bg-brand text-brand-foreground shadow-[0_12px_36px_-14px_var(--brand)]"
              aria-hidden
            >
              <Heart className="size-4 fill-current" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
