import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") ?? "/listings";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", req.url),
      { status: 303 }
    );
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] exchange failed", error);
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", req.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
