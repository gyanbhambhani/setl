import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = { status?: "approved" | "rejected" | "pending" };

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  const status = body.status;
  if (!status || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[admin/listings] update failed", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
