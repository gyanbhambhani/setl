import { ButtonLink } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";

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
    body: "No bait-and-switch stock imagery — what you see is what we approved.",
  },
  {
    label: "24-hour replies",
    body: "Landlords commit to answering interest fast, or we deprioritize them.",
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
            <p
              className="mb-8 inline-flex items-center gap-2 rounded-full
                border border-hairline bg-surface px-3 py-1 font-mono
                text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Renters
            </p>
            <h1
              className="text-[40px] font-semibold leading-[1.08] tracking-tight
                text-foreground sm:text-[56px]"
            >
              A Berkeley home you can{" "}
              <span className="italic text-accent">actually trust.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.65] text-muted">
              Setl matches you with hand-verified places near campus. Tell us
              your budget and dealbreakers once — then swipe listings that are
              already vetted.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/signup?as=renter" size="lg">
                Sign up
              </ButtonLink>
              <ButtonLink
                href="/login?redirect=/for-renters/onboard"
                size="lg"
                variant="secondary"
              >
                Sign in
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
                    <strong className="text-foreground">{count}</strong> renters
                    on the waitlist
                  </>
                ) : (
                  <>Join Berkeley renters on Setl</>
                )}
              </span>
            </div>
          </div>
          <aside className="md:col-span-5">
            <div
              className="rounded-[28px] border border-hairline bg-surface p-8
                shadow-[0_30px_80px_-50px_rgba(26,26,26,0.35)]"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                After you sign in
              </p>
              <ol className="mt-6 space-y-4 text-[15px] leading-[1.55] text-foreground/90">
                <li>
                  <strong className="text-foreground">1.</strong> Set budget,
                  move date, neighborhoods, and dealbreakers.
                </li>
                <li>
                  <strong className="text-foreground">2.</strong> Swipe verified
                  listings — right to save, left to pass.
                </li>
                <li>
                  <strong className="text-foreground">3.</strong> We email you
                  when there&rsquo;s a fit worth an intro.
                </li>
              </ol>
              <Link
                href="/signup?as=renter"
                className="mt-8 inline-flex text-[14px] font-medium text-accent
                  underline-offset-4 hover:underline"
              >
                Create an account →
              </Link>
            </div>
          </aside>
        </section>

        <section className="border-t border-hairline">
          <div
            className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-y-10 px-6
              py-16 md:grid-cols-3 md:gap-x-10"
          >
            {pillars.map((p, i) => (
              <div key={p.label} className="flex flex-col gap-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  0{i + 1}
                </span>
                <h3 className="text-[20px] font-semibold tracking-tight">
                  {p.label}
                </h3>
                <p className="text-[15px] leading-[1.6] text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
