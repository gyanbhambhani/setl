import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type RenterSwipeRow = {
  direction: "left" | "right";
  created_at: string;
  listing_id: string;
  listings: {
    address: string | null;
    rent: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    status: string;
    photo_urls: string[] | null;
    video_url: string | null;
  } | null;
};

export type RenterProfileRow = {
  id: string;
  budget_min: number | null;
  budget_max: number | null;
  move_date: string | null;
  roommates: number | null;
  neighborhoods: string[] | null;
  dealbreakers: string[] | null;
  description: string | null;
};

export type LandlordMatchRow = {
  direction: "left" | "right";
  created_at: string;
  renters: {
    budget_min: number | null;
    budget_max: number | null;
    move_date: string | null;
    neighborhoods: string[] | null;
  } | null;
};

export type LandlordListingActivity = {
  id: string;
  address: string | null;
  rent: number | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  photo_urls: string[] | null;
  video_url: string | null;
  matches: LandlordMatchRow[] | null;
};

const LISTING_SELECT =
  "address, rent, bedrooms, bathrooms, status, photo_urls, video_url";

export async function loadRenterSwipes(
  renterId: string
): Promise<RenterSwipeRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "direction, created_at, listing_id, listings (" + LISTING_SELECT + ")"
    )
    .eq("renter_id", renterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard] renter matches fetch failed", error);
    return [];
  }
  return (data as unknown as RenterSwipeRow[]) ?? [];
}

export async function loadRenterProfile(
  userId: string
): Promise<RenterProfileRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("renters")
    .select(
      "id, budget_min, budget_max, move_date, roommates, neighborhoods, " +
        "dealbreakers, description"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] renter profile fetch failed", error);
    return null;
  }
  return (data as unknown as RenterProfileRow) ?? null;
}

export async function loadLandlordActivity(
  userId: string
): Promise<LandlordListingActivity[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, address, rent, status, bedrooms, bathrooms, created_at, " +
        "photo_urls, video_url, " +
        "matches ( direction, created_at, renters ( budget_min, budget_max, " +
        "move_date, neighborhoods ) )"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard] landlord listings fetch failed", error);
    return [];
  }
  return (data as unknown as LandlordListingActivity[]) ?? [];
}
