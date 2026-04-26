import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { renterConfirmationEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

type Body = {
  budget_min?: number;
  budget_max?: number;
  move_date?: string;
  roommates?: number;
  neighborhoods?: string[];
  dealbreakers?: string[];
  description?: string;
};

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.email) {
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

  const payload = {
    user_id: user.id,
    email: user.email,
    budget_min: body.budget_min ?? null,
    budget_max: body.budget_max ?? null,
    move_date: body.move_date ?? null,
    roommates: body.roommates ?? null,
    neighborhoods: body.neighborhoods ?? [],
    dealbreakers: body.dealbreakers ?? [],
    description: body.description ?? null,
  };
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingErr } = await supabase
    .from("renters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingErr) {
    console.error("[renters] lookup failed", existingErr);
    return NextResponse.json(
      { error: "Could not save your preferences. Try again." },
      { status: 500 }
    );
  }

  const write = existing
    ? supabase.from("renters").update(payload).eq("id", existing.id).select("id")
    : supabase.from("renters").insert(payload).select("id");
  const { data: rows, error } = await write;
  const data = rows?.[0];

  if (error || !data) {
    console.error("[renters] insert failed", error);
    return NextResponse.json(
      { error: "Could not save your preferences. Try again." },
      { status: 500 }
    );
  }

  const { subject, html } = renterConfirmationEmail();
  await sendEmail({ to: user.email, subject, html });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
