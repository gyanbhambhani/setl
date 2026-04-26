import { ButtonLink } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import Link from "next/link";

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
    body: "Renters share preferences up front — fewer wasted tours and messages.",
  },
  {
    label: "24-hour promise",
    body: "You agree to reply within a day; that keeps your listing prioritized.",
  },
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
            <p
              className="mb-8 inline-flex items-center gap-2 rounded-full
                border border-hairline bg-surface px-3 py-1 font-mono
                text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Landlords
            </p>
            <h1
              className="text-[40px] font-semibold leading-[1.08] tracking-tight
                text-foreground sm:text-[56px]"
            >
              List a place renters{" "}
              <span className="italic text-accent">believe in.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.65] text-muted">
              Setl is built for landlords who are happy to show the real unit
              and respond quickly. Submit photos and details — we review, then
              match you with vetted Berkeley renters.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/signup?as=landlord" size="lg">
                Sign up
              </ButtonLink>
              <ButtonLink
                href="/login?redirect=/for-landlords/onboard"
                size="lg"
                variant="secondary"
              >
                Sign in
              </ButtonLink>
            </div>
          </div>
          <aside className="md:col-span-5">
            <div
              className="rounded-[28px] border border-hairline bg-surface p-8
                shadow-[0_30px_80px_-50px_rgba(26,26,26,0.35)]"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                What you&rsquo;ll need
              </p>
              <ul className="mt-6 space-y-3 text-[15px] leading-[1.55] text-foreground/90">
                <li>Unit address, rent, availability, beds &amp; baths</li>
                <li>Up to 8 photos (50MB each max on Free tier)</li>
                <li>Contact phone and landlord email</li>
                <li>Agreement to respond within 24 hours</li>
              </ul>
              <Link
                href="/signup?as=landlord"
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
