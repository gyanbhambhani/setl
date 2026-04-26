import { NextResponse, type NextRequest } from "next/server";
import { chaseUnresponsiveLandlords } from "@/lib/chaseLandlords";

export const runtime = "nodejs";

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) {
    return true;
  }
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await chaseUnresponsiveLandlords();
  return NextResponse.json(result);
}
