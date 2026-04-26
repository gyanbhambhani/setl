import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, checkPassword } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    const url = new URL("/admin?error=1", req.url);
    return NextResponse.redirect(url, { status: 303 });
  }
  const res = NextResponse.redirect(new URL("/admin", req.url), {
    status: 303,
  });
  res.cookies.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
