import { ButtonLink } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
            pt-16 pb-24 md:grid-cols-12 md:gap-x-10 md:pt-28"
        >
          <div className="md:col-span-7 md:pr-6">
            <p
              className="mb-8 inline-flex items-center gap-2 rounded-full
                border border-hairline bg-surface px-3 py-1 font-mono
                text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              By Berkeley, for Berkeley
            </p>
            <h1
              className="text-[44px] font-semibold leading-[1.05] tracking-tight
                text-foreground sm:text-[64px]"
            >
              Find a home you can{" "}
              <span className="italic text-accent">actually trust.</span>
              <span className="block text-foreground/70 text-[20px] mt-4 sm:text-[22px] font-normal not-italic">
                By Berkeley.
              </span>
            </h1>
            <p
              className="mt-6 max-w-xl text-[17px] leading-[1.65] text-muted"
            >
              Setl is verified student housing in Berkeley. Every listing is a
              real place, with real photos, from a landlord we&rsquo;ve spoken to.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/for-renters" size="lg">
                I&rsquo;m looking
              </ButtonLink>
              <ButtonLink
                href="/for-landlords"
                size="lg"
                variant="secondary"
              >
                I have a place
              </ButtonLink>
            </div>
            <div className="mt-10 flex items-center gap-4 text-[13px] text-muted">
              <div className="flex -space-x-2">
                {["#cdd9c5", "#e4c8a3", "#bcc6d3"].map((c) => (
                  <span
                    key={c}
                    className="h-7 w-7 rounded-full border-2 border-background"
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

          <aside className="md:col-span-5">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[28px]
                border border-hairline bg-surface"
            >
              <FakeListingPreview />
            </div>
          </aside>
        </section>

        <section className="border-t border-hairline">
          <div
            className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-y-10 px-6
              py-16 md:grid-cols-3 md:gap-x-10"
          >
            {props.map((p, i) => (
              <div key={p.label} className="flex flex-col gap-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  0{i + 1}
                </span>
                <h3 className="text-[20px] font-semibold tracking-tight">
                  {p.label}
                </h3>
                <p className="text-[15px] leading-[1.6] text-muted">
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
    <div className="absolute inset-0 flex flex-col">
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
            className="flex h-14 w-14 items-center justify-center rounded-full
              border border-[#fafaf8]/40 bg-black/30 backdrop-blur-sm"
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-2
            rounded-full bg-black/40 px-3 py-1 font-mono text-[10px]
            uppercase tracking-widest text-[#fafaf8] backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Verified
        </span>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between">
          <h4 className="text-[17px] font-semibold tracking-tight">
            2BR · Southside cottage
          </h4>
          <span className="text-[15px] font-medium">$2,850</span>
        </div>
        <p className="text-[13px] text-muted">
          Sunny corner unit, two blocks from campus, washer in unit.
        </p>
      </div>
    </div>
  );
}
