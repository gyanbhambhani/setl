import { landlordMatchNudgeEmail, sendEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicSiteUrl } from "@/lib/siteUrl";

/** Penalty scaffold for week-3 ranking when a chase nudge fires. */
const FLAG_RESPONSE_RATE = 0.25;

type MatchChaseRow = {
  id: string;
  listing_id: string;
  listings: {
    landlord_email: string | null;
    address: string | null;
  } | null;
};

export type ChaseLandlordsResult = {
  processedListings: number;
  nudgesSent: number;
  errors: string[];
};

/**
 * Finds right-swipe matches where the landlord was notified 24h+ ago, no
 * response recorded, no nudge yet. One email per listing; flags listing
 * response_rate and sets nudge_sent_at on all included matches.
 */
export async function chaseUnresponsiveLandlords(): Promise<ChaseLandlordsResult> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const errors: string[] = [];

  const { data: rows, error } = await supabase
    .from("matches")
    .select(
      "id, listing_id, listings ( landlord_email, address )"
    )
    .eq("direction", "right")
    .is("landlord_responded_at", null)
    .not("landlord_notified_at", "is", null)
    .lt("landlord_notified_at", cutoff)
    .is("nudge_sent_at", null);

  if (error) {
    console.error("[chaseLandlords] query", error);
    return {
      processedListings: 0,
      nudgesSent: 0,
      errors: [error.message],
    };
  }

  const list = (rows as unknown as MatchChaseRow[]) ?? [];
  const byListing = new Map<string, MatchChaseRow[]>();
  for (const row of list) {
    const lid = row.listing_id;
    const prev = byListing.get(lid) ?? [];
    prev.push(row);
    byListing.set(lid, prev);
  }

  const loginUrl = `${getPublicSiteUrl()}/login?redirect=/dashboard`;
  let nudgesSent = 0;

  for (const [listingId, group] of byListing) {
    const first = group[0]?.listings;
    const email = first?.landlord_email;
    const address = first?.address ?? "your listing";

    if (!email) {
      errors.push(`Missing landlord email for listing ${listingId}`);
      continue;
    }

    const ids = group.map((m) => m.id);
    const { subject, html } = landlordMatchNudgeEmail({
      address,
      renterCount: group.length,
      loginUrl,
    });

    await sendEmail({ to: email, subject, html });
    nudgesSent += 1;

    const now = new Date().toISOString();
    const { error: mErr } = await supabase
      .from("matches")
      .update({ nudge_sent_at: now })
      .in("id", ids)
      .is("nudge_sent_at", null);

    if (mErr) {
      errors.push(`matches ${listingId}: ${mErr.message}`);
    }

    const { error: lErr } = await supabase
      .from("listings")
      .update({ response_rate: FLAG_RESPONSE_RATE })
      .eq("id", listingId);

    if (lErr) {
      errors.push(`listing ${listingId}: ${lErr.message}`);
    }
  }

  return {
    processedListings: byListing.size,
    nudgesSent,
    errors,
  };
}
