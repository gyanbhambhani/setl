import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  getTopK,
  type Listing as MatchListing,
  type RenterProfile,
} from "@/lib/matching/scoreMatch";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { ListingsSwipe, type Listing } from "./ListingsSwipe";

export const metadata = { title: "Listings — Setl" };
export const dynamic = "force-dynamic";

async function getRenterProfile(
  userId: string
): Promise<(RenterProfile & { id: string }) | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("renters")
      .select(
        "id, budget_min, budget_max, move_date, roommates, neighborhoods, " +
          "dealbreakers"
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) {
      if (error) console.error("[listings] renter fetch failed", error);
      return null;
    }
    const row = data as unknown as {
      id: string;
      budget_min: number | null;
      budget_max: number | null;
      move_date: string | null;
      roommates: number | null;
      neighborhoods: string[] | null;
      dealbreakers: string[] | null;
    };
    return {
      id: row.id,
      budget_min: Number(row.budget_min ?? 0),
      budget_max: Number(row.budget_max ?? 0),
      move_date: String(row.move_date ?? ""),
      roommates: Number(row.roommates ?? 0),
      neighborhoods: row.neighborhoods ?? [],
      dealbreakers: row.dealbreakers ?? [],
    };
  } catch {
    return null;
  }
}

async function getSeenListingIds(renterId: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select("listing_id")
    .eq("renter_id", renterId);
  if (error) {
    console.error("[listings] seen matches fetch failed", error);
    return new Set();
  }
  return new Set((data ?? []).map((m) => String(m.listing_id)));
}

async function getApprovedListings(): Promise<Listing[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, address, rent, bedrooms, bathrooms, video_url, photo_urls, " +
          "amenities, available_date, neighborhood"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[listings] fetch failed", error);
      return [];
    }
    return (data ?? []) as unknown as Listing[];
  } catch (err) {
    console.error("[listings] fetch failed", err);
    return [];
  }
}

function neighborhoodFromAddress(address: string | null): string {
  if (!address) return "Berkeley";
  const lower = address.toLowerCase();
  if (lower.includes("dwight") || lower.includes("channing")) {
    return "Southside";
  }
  if (lower.includes("hearst") || lower.includes("euclid")) {
    return "Northside";
  }
  if (lower.includes("shattuck") || lower.includes("downtown")) {
    return "Downtown Berkeley";
  }
  if (lower.includes("oakland")) return "Oakland Border";
  return "Berkeley";
}

export default async function ListingsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/listings");
  }
  const renter = await getRenterProfile(user.id);
  if (!renter) {
    redirect("/for-renters/onboard");
  }

  const [raw, seenIds] = await Promise.all([
    getApprovedListings(),
    getSeenListingIds(renter.id),
  ]);
  const unseen = raw.filter((l) => !seenIds.has(l.id));
  const enriched = unseen.map((l) => ({
    ...l,
    neighborhood: l.neighborhood ?? neighborhoodFromAddress(l.address),
  }));

  const byId = new Map(enriched.map((l) => [l.id, l]));
  const scores = getTopK(renter, enriched as MatchListing[], 20);
  const sortedListings = scores
    .map((s) => byId.get(s.listing_id))
    .filter(Boolean) as Listing[];

  // ListingsSwipe renders the last item as the active top card.
  const swipeListings = [...sortedListings].reverse();

  return (
    <>
      <Header />
      <main className="grain relative flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-16">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Verified listings
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
                Swipe through Berkeley
              </h1>
            </div>
            <span className="text-[13px] text-muted">
              Right to save · Left to pass
            </span>
          </div>
          {sortedListings.length < 3 ? (
            <EmptyMatchedListings email={user.email ?? "your email"} />
          ) : (
            <ListingsSwipe listings={swipeListings} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyMatchedListings({ email }: { email: string }) {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4
        rounded-[28px] border border-hairline bg-surface px-8 py-16 text-center"
    >
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
        Setl matching
      </span>
      <h2 className="text-[24px] font-semibold tracking-tight">
        We&rsquo;re adding more verified listings soon
      </h2>
      <p className="max-w-sm text-[14px] leading-[1.6] text-muted">
        We didn&rsquo;t find enough strong matches yet. We&rsquo;ll notify{" "}
        <strong className="text-foreground">{email}</strong> when better fits
        come in.
      </p>
    </div>
  );
}
