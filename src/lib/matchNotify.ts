import {
  landlordMatchInterestEmail,
  renterMatchQueuedEmail,
  sendEmail,
} from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicSiteUrl } from "@/lib/siteUrl";

type NotifyResult =
  | { ok: true; skipped?: undefined }
  | { ok: true; skipped: string }
  | { ok: false; error: string };

function budgetLabel(
  min: number | null,
  max: number | null
): string {
  if (min != null && max != null) return `$${min}–$${max}`;
  return "Not specified";
}

/**
 * Sends landlord + renter emails and sets landlord_notified_at when a renter
 * saves a listing. Idempotent if landlord_notified_at is already set.
 */
export async function notifyMatchInterest(params: {
  renterId: string;
  renterEmail: string | null | undefined;
  listingId: string;
}): Promise<NotifyResult> {
  const supabase = getSupabaseAdmin();
  const { renterId, listingId } = params;

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, direction, landlord_notified_at")
    .eq("renter_id", renterId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (matchErr) {
    console.error("[matchNotify] match select", matchErr);
    return { ok: false, error: "Could not load match." };
  }
  if (!match || match.direction !== "right") {
    return { ok: true, skipped: "not_a_save" };
  }
  if (match.landlord_notified_at) {
    return { ok: true, skipped: "already_notified" };
  }

  const notifiedAt = new Date().toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from("matches")
    .update({ landlord_notified_at: notifiedAt })
    .eq("id", match.id)
    .is("landlord_notified_at", null)
    .select("id")
    .maybeSingle();

  if (claimErr) {
    console.error("[matchNotify] claim update", claimErr);
    return { ok: false, error: "Could not update match." };
  }
  if (!claimed) {
    return { ok: true, skipped: "claim_lost" };
  }

  const { data: listing, error: listErr } = await supabase
    .from("listings")
    .select("landlord_email, address")
    .eq("id", listingId)
    .maybeSingle();

  if (listErr || !listing?.landlord_email) {
    console.error("[matchNotify] listing", listErr);
    return { ok: false, error: "Listing or landlord email missing." };
  }

  const { data: renter, error: renterErr } = await supabase
    .from("renters")
    .select(
      "email, budget_min, budget_max, move_date, neighborhoods"
    )
    .eq("id", renterId)
    .maybeSingle();

  if (renterErr || !renter) {
    console.error("[matchNotify] renter", renterErr);
    return { ok: false, error: "Renter profile missing." };
  }

  const loginUrl = `${getPublicSiteUrl()}/login?redirect=/dashboard`;
  const address = listing.address ?? "your listing";
  const hoods = (renter.neighborhoods ?? []).join(", ") || "—";
  const move = renter.move_date ?? "—";
  const budget = budgetLabel(renter.budget_min, renter.budget_max);

  const { subject, html } = landlordMatchInterestEmail({
    address,
    budgetLabel: budget,
    moveDate: move,
    neighborhoods: hoods,
    loginUrl,
  });

  const renterTo = params.renterEmail ?? renter.email;
  await sendEmail({
    to: listing.landlord_email,
    subject,
    html,
    replyTo: renterTo ?? undefined,
  });

  if (renterTo) {
    const queued = renterMatchQueuedEmail();
    await sendEmail({
      to: renterTo,
      subject: queued.subject,
      html: queued.html,
    });
  }

  return { ok: true };
}
