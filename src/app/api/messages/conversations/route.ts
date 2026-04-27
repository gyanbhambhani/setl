import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabaseServer";
import { listConversationsForUser } from "@/lib/messaging/conversations";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }
  const conversations = await listConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}
