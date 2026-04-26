import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
import { LandlordPanel, RenterPanel } from "./DashboardPanels";
import {
  loadLandlordActivity,
  loadRenterProfile,
  loadRenterSwipes,
} from "./loadDashboard";

export const metadata = { title: "Dashboard — Setl" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const [landlordListings, renterProfile] = await Promise.all([
    loadLandlordActivity(user.id),
    loadRenterProfile(user.id),
  ]);

  const swipes = renterProfile
    ? await loadRenterSwipes(renterProfile.id)
    : [];

  const hasLandlord = landlordListings.length > 0;
  const hasRenter = renterProfile !== null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Your Setl
            </p>
            <h1 className="mt-2 text-[34px] font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              {hasLandlord && hasRenter
                ? "Landlord activity and renter swipes — jump to a section below."
                : hasLandlord
                  ? "Your submissions and renter interest."
                  : hasRenter
                    ? "Your profile and swipe history."
                    : "Get started as a renter, landlord, or both."}
            </p>
          </div>
          {hasLandlord && hasRenter ? (
            <nav className="flex flex-wrap gap-2 text-[13px] font-medium">
              <a
                href="#renter"
                className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-foreground hover:border-foreground/30"
              >
                Profile &amp; swipes
              </a>
              <a
                href="#landlord"
                className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-foreground hover:border-foreground/30"
              >
                My listings
              </a>
            </nav>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {!hasLandlord && !hasRenter ? (
            <EmptyOnboarding />
          ) : (
            <>
              {hasRenter ? (
                <RenterPanel profile={renterProfile} rows={swipes} />
              ) : (
                <RenterPrompt />
              )}
              {hasLandlord ? (
                <LandlordPanel listings={landlordListings} />
              ) : (
                <LandlordPrompt />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyOnboarding() {
  return (
    <section className="rounded-2xl border border-hairline bg-surface px-6 py-10">
      <h2 className="text-[19px] font-semibold tracking-tight">
        Nothing here yet
      </h2>
      <p className="mt-2 text-[15px] text-muted">
        Add renter preferences to swipe listings, or submit a place as a
        landlord — or do both.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/for-renters/onboard"
          className="inline-flex justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[#fafaf8] hover:bg-accent-hover"
        >
          Renter setup
        </Link>
        <Link
          href="/for-landlords/onboard"
          className="inline-flex justify-center rounded-full border border-hairline bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:border-foreground/30"
        >
          List a place
        </Link>
      </div>
    </section>
  );
}

function LandlordPrompt() {
  return (
    <section className="rounded-2xl border border-dashed border-hairline bg-background/40 px-6 py-8">
      <h2 className="text-[16px] font-semibold tracking-tight">
        Landlord dashboard
      </h2>
      <p className="mt-2 text-[14px] text-muted">
        Submit a listing to track status, saves, and renter interest here.
      </p>
      <Link
        href="/for-landlords/onboard"
        className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#fafaf8] hover:bg-accent-hover"
      >
        Submit a listing
      </Link>
    </section>
  );
}

function RenterPrompt() {
  return (
    <section className="rounded-2xl border border-dashed border-hairline bg-background/40 px-6 py-8">
      <h2 className="text-[16px] font-semibold tracking-tight">
        Renter dashboard
      </h2>
      <p className="mt-2 text-[14px] text-muted">
        Set your budget and neighborhoods to unlock Browse and swipe history.
      </p>
      <Link
        href="/for-renters/onboard"
        className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#fafaf8] hover:bg-accent-hover"
      >
        Set preferences
      </Link>
    </section>
  );
}
