import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MIN_PASSWORD = 8;
const MAX_EMAIL = 254;
/** Bcrypt truncates around 72 bytes; keep a safe cap for validation. */
const MAX_PASSWORD = 72;

function isValidEmail(s: string): boolean {
  if (s.length > MAX_EMAIL) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown; role?: unknown };
  try {
    body = (await req.json()) as {
      email?: unknown;
      password?: unknown;
      role?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rawRole = typeof body.role === "string" ? body.role : "";
  const role: "renter" | "landlord" | null =
    rawRole === "renter" || rawRole === "landlord" ? rawRole : null;

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email." },
      { status: 400 }
    );
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD} characters.` },
      { status: 400 }
    );
  }
  if (password.length > MAX_PASSWORD) {
    return NextResponse.json(
      { error: "Password is too long." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: role ? { role } : {},
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already been registered") ||
      msg.includes("already exists") ||
      msg.includes("duplicate")
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Try signing in.",
        },
        { status: 409 }
      );
    }
    console.error("[auth/signup] createUser", error);
    return NextResponse.json(
      { error: "Could not create account. Try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
