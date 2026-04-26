import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";

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

  const { error } = await supabase
    .from("matches")
    .upsert(
      { renter_id: renter.id, listing_id, direction },
      { onConflict: "renter_id,listing_id" }
    );

  if (error) {
    console.error("[matches] upsert failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
