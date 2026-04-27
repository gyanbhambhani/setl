import {
  landlordDailyDigestEmail,
  renterDailyDigestEmail,
  sendEmail,
  type LandlordDigestSave,
  type LandlordDigestListingSummary,
} from "@/lib/email";
import { getPublicSiteUrl } from "@/lib/siteUrl";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DIGEST_WINDOW_HOURS = 20;

export type DailyDigestResult = {
  landlordEmails: number;
  renterEmails: number;
  errors: string[];
};

type RenterRef = {
  budget_min: number | null;
  budget_max: number | null;
  move_date: string | null;
  neighborhoods: string[] | null;
};

type ListingRef = {
  id: string;
  user_id: string | null;
  address: string | null;
  landlord_email: string | null;
};

type SaveJoinRow = {
  id: string;
  listing_id: string;
  created_at: string;
  landlord_notified_at: string | null;
  renters: RenterRef | null;
  listings: ListingRef | null;
};

function budgetLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `$${min}–$${max}`;
  return "Not specified";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";
}

/**
 * Sends one digest per landlord covering not-yet-notified saves, and one
 * digest per renter covering swipes since their last_digest_at. Idempotent:
 * landlord side stamps landlord_notified_at on included matches, renter side
 * advances renters.last_digest_at.
 */
export async function runDailyDigests(): Promise<DailyDigestResult> {
  const errors: string[] = [];
  const landlordEmails = await runLandlordDigests(errors);
  const renterEmails = await runRenterDigests(errors);
  return { landlordEmails, renterEmails, errors };
}

async function runLandlordDigests(errors: string[]): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, listing_id, created_at, landlord_notified_at, " +
        "renters ( budget_min, budget_max, move_date, neighborhoods ), " +
        "listings ( id, user_id, address, landlord_email )"
    )
    .eq("direction", "right")
    .is("landlord_notified_at", null);

  if (error) {
    errors.push(`landlord saves query: ${error.message}`);
    return 0;
  }

  const rows = (data as unknown as SaveJoinRow[]) ?? [];
  const byLandlord = new Map<string, SaveJoinRow[]>();
  for (const row of rows) {
    const ownerId = row.listings?.user_id ?? null;
    const email = row.listings?.landlord_email ?? null;
    if (!ownerId || !email) continue;
    const key = `${ownerId}|${email}`;
    const cur = byLandlord.get(key) ?? [];
    cur.push(row);
    byLandlord.set(key, cur);
  }

  if (byLandlord.size === 0) return 0;

  const ownerIds = Array.from(
    new Set(Array.from(byLandlord.keys()).map((k) => k.split("|")[0]))
  );

  const { data: listingRows, error: listErr } = await supabase
    .from("listings")
    .select(
      "id, user_id, address, " +
        "matches ( direction, landlord_notified_at, landlord_responded_at )"
    )
    .in("user_id", ownerIds);

  if (listErr) {
    errors.push(`landlord listings query: ${listErr.message}`);
  }

  const summariesByOwner = new Map<string, LandlordDigestListingSummary[]>();
  type ListingSummaryRow = {
    id: string;
    user_id: string | null;
    address: string | null;
    matches: Array<{
      direction: string;
      landlord_notified_at: string | null;
      landlord_responded_at: string | null;
    }> | null;
  };
  for (const L of (listingRows as unknown as ListingSummaryRow[]) ?? []) {
    if (!L.user_id) continue;
    const matches = L.matches ?? [];
    const saves = matches.filter((m) => m.direction === "right");
    const awaiting = saves.filter(
      (m) => m.landlord_notified_at && !m.landlord_responded_at
    ).length;
    const cur = summariesByOwner.get(L.user_id) ?? [];
    cur.push({
      address: L.address ?? "Listing",
      saves: saves.length,
      awaitingResponse: awaiting,
    });
    summariesByOwner.set(L.user_id, cur);
  }

  const loginUrl = `${getPublicSiteUrl()}/login?redirect=/dashboard`;
  const now = new Date().toISOString();
  let sent = 0;

  for (const [key, group] of byLandlord) {
    const [ownerId, landlordEmail] = key.split("|");
    if (!landlordEmail) continue;

    const newSaves: LandlordDigestSave[] = group.map((row) => ({
      address: row.listings?.address ?? "your listing",
      budgetLabel: budgetLabel(
        row.renters?.budget_min ?? null,
        row.renters?.budget_max ?? null
      ),
      moveDate: row.renters?.move_date ?? "—",
      neighborhoods:
        (row.renters?.neighborhoods ?? []).join(", ") || "—",
      savedAt: formatDate(row.created_at),
    }));

    const summaries = summariesByOwner.get(ownerId) ?? [];
    const totalAwaiting = summaries.reduce(
      (sum, s) => sum + s.awaitingResponse,
      0
    );

    const { subject, html } = landlordDailyDigestEmail({
      newSaves,
      awaitingResponse: totalAwaiting + newSaves.length,
      listings: summaries,
      loginUrl,
    });

    await sendEmail({ to: landlordEmail, subject, html });
    sent += 1;

    const ids = group.map((g) => g.id);
    const { error: stampErr } = await supabase
      .from("matches")
      .update({ landlord_notified_at: now })
      .in("id", ids)
      .is("landlord_notified_at", null);

    if (stampErr) {
      errors.push(`landlord stamp ${ownerId}: ${stampErr.message}`);
    }
  }

  return sent;
}

type RenterDigestRow = {
  id: string;
  email: string | null;
  last_digest_at: string | null;
};

type RenterMatchSummaryRow = {
  direction: string;
  created_at: string;
  landlord_responded_at: string | null;
  listings: { address: string | null } | null;
};

async function runRenterDigests(errors: string[]): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("renters")
    .select("id, email, last_digest_at")
    .not("email", "is", null);

  if (error) {
    errors.push(`renter list query: ${error.message}`);
    return 0;
  }

  const renters = (data as unknown as RenterDigestRow[]) ?? [];
  const cutoffMs = Date.now() - DIGEST_WINDOW_HOURS * 60 * 60 * 1000;
  const loginUrl = `${getPublicSiteUrl()}/login?redirect=/dashboard`;
  const now = new Date().toISOString();
  let sent = 0;

  for (const r of renters) {
    if (!r.email) continue;
    const lastDigestMs = r.last_digest_at
      ? new Date(r.last_digest_at).getTime()
      : 0;
    if (lastDigestMs > cutoffMs) continue;

    const sinceIso = new Date(
      Math.max(lastDigestMs, cutoffMs)
    ).toISOString();

    const { data: matchData, error: mErr } = await supabase
      .from("matches")
      .select(
        "direction, created_at, landlord_responded_at, " +
          "listings ( address )"
      )
      .eq("renter_id", r.id)
      .gte("created_at", sinceIso);

    if (mErr) {
      errors.push(`renter ${r.id} matches: ${mErr.message}`);
      continue;
    }

    const rows = (matchData as unknown as RenterMatchSummaryRow[]) ?? [];
    if (rows.length === 0) continue;

    const saves = rows.filter((m) => m.direction === "right");
    const passes = rows.filter((m) => m.direction === "left");
    const awaiting = saves.filter((s) => !s.landlord_responded_at).length;
    const savedAddresses = saves
      .map((s) => s.listings?.address ?? "Listing")
      .slice(0, 8);

    const { subject, html } = renterDailyDigestEmail({
      activity: {
        savedAddresses,
        passedCount: passes.length,
        awaitingLandlord: awaiting,
      },
      loginUrl,
    });

    await sendEmail({ to: r.email, subject, html });
    sent += 1;

    const { error: stampErr } = await supabase
      .from("renters")
      .update({ last_digest_at: now })
      .eq("id", r.id);

    if (stampErr) {
      errors.push(`renter stamp ${r.id}: ${stampErr.message}`);
    }
  }

  return sent;
}
