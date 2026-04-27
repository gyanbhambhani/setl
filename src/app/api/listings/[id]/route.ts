import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupErr } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (lookupErr) {
    console.error("[listings] lookup failed", lookupErr);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clear matches first to avoid orphaned FK references.
  const { error: matchDelErr } = await supabase
    .from("matches")
    .delete()
    .eq("listing_id", id);
  if (matchDelErr) {
    console.error("[listings] match cleanup failed", matchDelErr);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  const { error: delErr } = await supabase
    .from("listings")
    .delete()
    .eq("id", id);

  if (delErr) {
    console.error("[listings] delete failed", delErr);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
