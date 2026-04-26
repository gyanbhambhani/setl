export type RenterProfile = {
  budget_min: number;
  budget_max: number;
  move_date: string;
  roommates: number;
  neighborhoods: string[];
  dealbreakers: string[];
};

export type Listing = {
  id: string;
  rent: number | null;
  available_date: string | null;
  bedrooms: number | null;
  neighborhood: string | null;
  amenities: string[] | null;
};

export type ScoredListing = {
  listing_id: string;
  score: number;
  breakdown: {
    budget: number;
    timing: number;
    neighborhood: number;
    size: number;
  };
};

const OVER_BUDGET_ALLOWANCE = 0.1;
const MIN_SCORE = 20;

const NEIGHBORHOOD_ALIASES: Record<string, string> = {
  southside: "southside",
  northside: "northside",
  downtown: "downtown berkeley",
  downtown_berkeley: "downtown berkeley",
  oakland_border: "oakland border",
};

function normalizeToken(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return NEIGHBORHOOD_ALIASES[normalized.replace(/\s+/g, "_")] ?? normalized;
}

function amenitySet(listing: Listing): Set<string> {
  return new Set((listing.amenities ?? []).map(normalizeToken));
}

function hasAnyAmenity(amenities: Set<string>, values: string[]): boolean {
  return values.some((v) => amenities.has(normalizeToken(v)));
}

function violatesDealbreaker(
  dealbreaker: string,
  amenities: Set<string>
): boolean {
  const d = normalizeToken(dealbreaker);
  if (d === "no laundry") {
    return !hasAnyAmenity(amenities, ["in unit laundry", "shared laundry"]);
  }
  if (d === "no pets" || d === "no pets allowed") {
    return !amenities.has("pets allowed");
  }
  if (d === "no parking") {
    return !amenities.has("parking");
  }
  if (d === "no dishwasher") {
    return !amenities.has("dishwasher");
  }
  if (d === "shared bath" || d === "shared bathroom") {
    return amenities.has("shared bathroom") || amenities.has("shared bath");
  }
  return false;
}

function budgetPasses(renter: RenterProfile, listing: Listing): boolean {
  if (listing.rent == null) return true;
  return listing.rent <= renter.budget_max * (1 + OVER_BUDGET_ALLOWANCE);
}

export function passesHardFilters(
  renter: RenterProfile,
  listing: Listing
): boolean {
  if (!budgetPasses(renter, listing)) return false;
  const amenities = amenitySet(listing);
  return !renter.dealbreakers.some((d) => violatesDealbreaker(d, amenities));
}

function scoreBudget(renter: RenterProfile, listing: Listing): number {
  if (listing.rent == null) return 15;
  if (listing.rent < renter.budget_min) return 25;
  if (listing.rent <= renter.budget_max) return 35;

  const overagePct =
    (listing.rent - renter.budget_max) / Math.max(renter.budget_max, 1);
  if (overagePct > OVER_BUDGET_ALLOWANCE) return 0;
  return Math.max(0, 35 * (1 - overagePct / OVER_BUDGET_ALLOWANCE));
}

function daysBetween(a: string, b: string): number | null {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return null;
  return Math.round((bMs - aMs) / (1000 * 60 * 60 * 24));
}

function scoreTiming(renter: RenterProfile, listing: Listing): number {
  if (!renter.move_date || !listing.available_date) return 10;
  const diff = daysBetween(renter.move_date, listing.available_date);
  if (diff == null) return 10;
  if (diff < -30 || diff > 60) return 0;

  const abs = Math.abs(diff);
  if (abs <= 7) return 25;
  if (abs <= 14) return 20;
  if (abs <= 30) return 12;
  return 5;
}

function scoreNeighborhood(renter: RenterProfile, listing: Listing): number {
  const listingNeighborhood = normalizeToken(listing.neighborhood);
  if (!listingNeighborhood) return 10;
  const wanted = new Set(renter.neighborhoods.map(normalizeToken));
  if (wanted.size === 0) return 10;
  return wanted.has(listingNeighborhood) ? 25 : 0;
}

function scoreSize(renter: RenterProfile, listing: Listing): number {
  if (listing.bedrooms == null) return 5;
  const desiredBedrooms = renter.roommates + 1;
  const delta = Math.abs(listing.bedrooms - desiredBedrooms);
  if (delta === 0) return 15;
  if (delta === 1) return 8;
  return 0;
}

export function scoreMatch(
  renter: RenterProfile,
  listing: Listing
): ScoredListing {
  const breakdown = {
    budget: scoreBudget(renter, listing),
    timing: scoreTiming(renter, listing),
    neighborhood: scoreNeighborhood(renter, listing),
    size: scoreSize(renter, listing),
  };
  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return {
    listing_id: listing.id,
    score: Math.round(score * 10) / 10,
    breakdown,
  };
}

export function getTopK(
  renter: RenterProfile,
  listings: Listing[],
  k: number = 20
): ScoredListing[] {
  return listings
    .filter((l) => passesHardFilters(renter, l))
    .map((l) => scoreMatch(renter, l))
    .filter((s) => s.score > MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
