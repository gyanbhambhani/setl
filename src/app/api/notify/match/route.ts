import { NextResponse, type NextRequest } from "next/server";
import { notifyMatchInterest } from "@/lib/matchNotify";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = { listing_id?: string };

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

  const listingId = body.listing_id;
  if (!listingId || !UUID_RE.test(listingId)) {
    return NextResponse.json({ error: "Bad listing_id" }, { status: 400 });
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

  const result = await notifyMatchInterest({
    renterId: renter.id,
    renterEmail: user.email,
    listingId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped ?? null,
  });
}
