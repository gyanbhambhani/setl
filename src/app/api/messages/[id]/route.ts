import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/supabaseServer";
import {
  appendUserMessage,
  getConversation,
  type DecryptedMessage,
} from "@/lib/messaging/conversations";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strip the raw auth.users.id off messages before sending them to the
 * client; replace with a relational `from` flag. Keeps every other field.
 */
function publicMessage(m: DecryptedMessage, viewerId: string) {
  const from: "me" | "them" | "system" =
    m.kind === "system"
      ? "system"
      : m.sender_user_id === viewerId
        ? "me"
        : "them";
  return {
    id: m.id,
    conversation_id: m.conversation_id,
    from,
    kind: m.kind,
    body: m.body,
    created_at: m.created_at,
    key_version: m.key_version,
  };
}

export async function GET(
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
  const result = await getConversation({
    conversationId: id,
    userId: user.id,
  });
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    conversation: scrubConversation(result.conversation, result.perspective),
    perspective: result.perspective,
    messages: result.messages.map((m) => publicMessage(m, user.id)),
  });
}

function scrubConversation(
  c: Awaited<ReturnType<typeof getConversation>> extends infer R
    ? R extends { conversation: infer C } ? C : never
    : never,
  perspective: "renter" | "landlord"
) {
  if (!c) return null;
  return {
    id: c.id,
    listing_id: c.listing_id,
    listing_address: c.listing_address,
    listing_thumb_url: c.listing_thumb_url,
    last_message_at: c.last_message_at,
    created_at: c.created_at,
    perspective,
    other_email:
      perspective === "renter" ? c.landlord_email : c.renter_email,
  };
}

export async function POST(
  req: NextRequest,
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

  let body: { body?: unknown };
  try {
    body = (await req.json()) as { body?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.body !== "string") {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const result = await appendUserMessage({
    conversationId: id,
    userId: user.id,
    body: body.body,
  });
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({
    message: publicMessage(result, user.id),
  });
}
