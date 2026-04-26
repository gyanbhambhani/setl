import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { ListingsSwipe, type Listing } from "./ListingsSwipe";

export const metadata = { title: "Listings — Setl" };
export const dynamic = "force-dynamic";

async function hasRenterProfile(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("renters")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

async function getApprovedListings(): Promise<Listing[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, address, rent, bedrooms, bathrooms, video_url, photo_urls, amenities," +
          " available_date"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
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
  if (lower.includes("oakland")) return "Oakland border";
  return "Berkeley";
}

export default async function ListingsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/listings");
  }
  const onboarded = await hasRenterProfile(user.id);
  if (!onboarded) {
    redirect("/for-renters/onboard");
  }
  const raw = await getApprovedListings();
  const enriched = raw.map((l) => ({
    ...l,
    neighborhood: neighborhoodFromAddress(l.address),
  }));
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
          <ListingsSwipe listings={enriched} />
        </div>
      </main>
      <Footer />
    </>
  );
}
