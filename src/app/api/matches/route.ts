import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { ensureConversation } from "@/lib/messaging/conversations";

export const runtime = "nodejs";

type Body = {
  listing_id?: string;
  direction?: "left" | "right";
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { listing_id, direction } = body;
  if (!listing_id || !UUID_RE.test(listing_id)) {
    return NextResponse.json({ error: "Bad listing_id" }, { status: 400 });
  }
  if (direction !== "left" && direction !== "right") {
    return NextResponse.json({ error: "Bad direction" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: renter } = await supabase
    .from("renters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!renter) {
    return NextResponse.json(
      { error: "Finish renter onboarding first." },
      { status: 412 }
    );
  }

  const { data: matchRow, error } = await supabase
    .from("matches")
    .upsert(
      { renter_id: renter.id, listing_id, direction },
      { onConflict: "renter_id,listing_id" }
    )
    .select("id")
    .single();

  if (error || !matchRow) {
    console.error("[matches] upsert failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // On a right swipe, open (or refresh) the messaging thread between the
  // renter and the landlord so they can talk in-app. The function is
  // idempotent: a second right-swipe on the same listing returns the existing
  // conversation. Failures are logged but don't fail the swipe — the
  // conversation can be opened lazily later if anything goes wrong.
  if (direction === "right") {
    try {
      await ensureConversation({
        matchId: matchRow.id,
        renterUserId: user.id,
        listingId: listing_id,
      });
    } catch (err) {
      console.error("[matches] ensureConversation failed", err);
    }
  }

  // Daily digest still picks up landlord_notified_at = null rows for the
  // batched email; in-app threading just runs in parallel.
  return NextResponse.json({ ok: true });
}
