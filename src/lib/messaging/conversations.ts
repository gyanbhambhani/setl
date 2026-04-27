import { type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  decryptFromStorage,
  encryptForStorage,
  type StoredMessageRow,
} from "@/lib/messaging/cipher";

export type ConversationRow = {
  id: string;
  listing_id: string;
  match_id: string | null;
  renter_user_id: string;
  landlord_user_id: string;
  renter_email: string | null;
  landlord_email: string | null;
  listing_address: string | null;
  listing_thumb_url: string | null;
  last_message_at: string | null;
  renter_last_read_at: string | null;
  landlord_last_read_at: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  kind: "user" | "system";
  body_plaintext: string | null;
  body_ciphertext: string | null;
  iv: string | null;
  key_version: number;
  created_at: string;
};

export type DecryptedMessage = Omit<MessageRow, "body_plaintext"> & {
  body: string;
};

export type ConversationListItem = ConversationRow & {
  preview: string;
  unread_count: number;
  other_email: string | null;
  perspective: "renter" | "landlord";
};

const MAX_MESSAGES_PER_THREAD = 200;

/**
 * Look up auth.users by id via the admin API. Returns null if not found.
 */
async function fetchAuthUserEmail(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Idempotently create the conversation tied to (listing, renter). Returns the
 * conversation row whether it was just created or already existed. Skips
 * creation (returns null) when the listing is not owned by an auth user yet.
 */
export async function ensureConversation(params: {
  matchId: string | null;
  renterUserId: string;
  listingId: string;
}): Promise<ConversationRow | null> {
  const admin = getSupabaseAdmin();

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, user_id, landlord_email, address, photo_urls")
    .eq("id", params.listingId)
    .maybeSingle();
  if (listingError || !listing) return null;
  if (!listing.user_id) {
    // Landlord hasn't claimed an account; nothing to thread against yet.
    return null;
  }
  if (listing.user_id === params.renterUserId) {
    // Same human is both renter and landlord on this listing — skip.
    return null;
  }

  const renterEmail = await fetchAuthUserEmail(admin, params.renterUserId);
  const landlordEmail =
    (await fetchAuthUserEmail(admin, listing.user_id)) ??
    listing.landlord_email ??
    null;

  const thumb = Array.isArray(listing.photo_urls)
    ? (listing.photo_urls as string[])[0] ?? null
    : null;

  const { data: existing } = await admin
    .from("conversations")
    .select("*")
    .eq("listing_id", params.listingId)
    .eq("renter_user_id", params.renterUserId)
    .maybeSingle<ConversationRow>();

  if (existing) {
    if (params.matchId && existing.match_id !== params.matchId) {
      await admin
        .from("conversations")
        .update({ match_id: params.matchId })
        .eq("id", existing.id);
    }
    return existing;
  }

  const { data: created, error: insertError } = await admin
    .from("conversations")
    .insert({
      listing_id: params.listingId,
      match_id: params.matchId,
      renter_user_id: params.renterUserId,
      landlord_user_id: listing.user_id,
      renter_email: renterEmail,
      landlord_email: landlordEmail,
      listing_address: listing.address ?? null,
      listing_thumb_url: thumb,
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single<ConversationRow>();

  if (insertError || !created) {
    // Race: another request inserted between our check and insert. Re-read.
    const { data: refetched } = await admin
      .from("conversations")
      .select("*")
      .eq("listing_id", params.listingId)
      .eq("renter_user_id", params.renterUserId)
      .maybeSingle<ConversationRow>();
    return refetched ?? null;
  }

  await admin.from("messages").insert({
    conversation_id: created.id,
    sender_user_id: null,
    kind: "system",
    body_plaintext: "Renter saved this listing. Say hi.",
    key_version: 0,
  });

  return created;
}

/**
 * Inboxes for a user. The caller's perspective is computed per row so the UI
 * can pick the right counterparty email to render.
 */
export async function listConversationsForUser(
  userId: string
): Promise<ConversationListItem[]> {
  const admin = getSupabaseAdmin();
  const { data: rows } = await admin
    .from("conversations")
    .select("*")
    .or(`renter_user_id.eq.${userId},landlord_user_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const conversations = (rows ?? []) as ConversationRow[];
  if (conversations.length === 0) return [];

  const ids = conversations.map((c) => c.id);

  const { data: latestMessages } = await admin
    .from("messages")
    .select("conversation_id, kind, body_plaintext, key_version, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  const latestByConv = new Map<
    string,
    { kind: string; body_plaintext: string | null; key_version: number }
  >();
  for (const m of latestMessages ?? []) {
    if (!latestByConv.has(m.conversation_id)) {
      latestByConv.set(m.conversation_id, {
        kind: m.kind,
        body_plaintext: m.body_plaintext,
        key_version: m.key_version,
      });
    }
  }

  const { data: unreadRows } = await admin
    .from("messages")
    .select("conversation_id, created_at, sender_user_id, kind")
    .in("conversation_id", ids);

  const result: ConversationListItem[] = [];
  for (const c of conversations) {
    const perspective: "renter" | "landlord" =
      c.renter_user_id === userId ? "renter" : "landlord";
    const other_email =
      perspective === "renter" ? c.landlord_email : c.renter_email;
    const lastReadAt =
      perspective === "renter"
        ? c.renter_last_read_at
        : c.landlord_last_read_at;

    let unread = 0;
    for (const m of unreadRows ?? []) {
      if (m.conversation_id !== c.id) continue;
      if (m.sender_user_id === userId) continue;
      if (lastReadAt && new Date(m.created_at) <= new Date(lastReadAt)) {
        continue;
      }
      unread += 1;
    }

    const latest = latestByConv.get(c.id);
    let preview = "Conversation started";
    if (latest) {
      if (latest.key_version !== 0) {
        preview = "(encrypted message)";
      } else {
        preview = (latest.body_plaintext ?? "").slice(0, 140);
      }
    }

    result.push({
      ...c,
      preview,
      unread_count: unread,
      other_email,
      perspective,
    });
  }
  return result;
}

/**
 * Returns the conversation if the caller is a participant, plus its messages
 * (decrypted). Stamps the caller's last_read_at as a side effect.
 */
export async function getConversation(params: {
  conversationId: string;
  userId: string;
}): Promise<
  | {
      conversation: ConversationRow;
      perspective: "renter" | "landlord";
      messages: DecryptedMessage[];
    }
  | null
> {
  const admin = getSupabaseAdmin();
  const { data: conv } = await admin
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .maybeSingle<ConversationRow>();

  if (!conv) return null;
  const isRenter = conv.renter_user_id === params.userId;
  const isLandlord = conv.landlord_user_id === params.userId;
  if (!isRenter && !isLandlord) return null;

  const { data: rawMessages } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES_PER_THREAD);

  const messages: DecryptedMessage[] = [];
  for (const row of (rawMessages ?? []) as MessageRow[]) {
    const body = await decryptFromStorage(row as StoredMessageRow);
    const { body_plaintext: _omit, ...rest } = row;
    void _omit;
    messages.push({ ...rest, body });
  }

  await markRead({
    conversationId: conv.id,
    userId: params.userId,
  });

  return {
    conversation: conv,
    perspective: isRenter ? "renter" : "landlord",
    messages,
  };
}

export async function markRead(params: {
  conversationId: string;
  userId: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: conv } = await admin
    .from("conversations")
    .select("renter_user_id, landlord_user_id")
    .eq("id", params.conversationId)
    .maybeSingle();
  if (!conv) return;
  const now = new Date().toISOString();
  if (conv.renter_user_id === params.userId) {
    await admin
      .from("conversations")
      .update({ renter_last_read_at: now })
      .eq("id", params.conversationId);
  } else if (conv.landlord_user_id === params.userId) {
    await admin
      .from("conversations")
      .update({ landlord_last_read_at: now })
      .eq("id", params.conversationId);
  }
}

export async function appendUserMessage(params: {
  conversationId: string;
  userId: string;
  body: string;
}): Promise<DecryptedMessage | { error: string; status: number }> {
  const trimmed = params.body.trim();
  if (!trimmed) return { error: "Message is empty", status: 400 };
  if (trimmed.length > 4000) {
    return { error: "Message too long (max 4000 chars)", status: 400 };
  }

  const admin = getSupabaseAdmin();
  const { data: conv } = await admin
    .from("conversations")
    .select("id, renter_user_id, landlord_user_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  if (!conv) return { error: "Conversation not found", status: 404 };
  if (
    conv.renter_user_id !== params.userId &&
    conv.landlord_user_id !== params.userId
  ) {
    return { error: "Conversation not found", status: 404 };
  }

  const payload = await encryptForStorage(trimmed);
  const { data: inserted, error } = await admin
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_user_id: params.userId,
      kind: "user",
      body_plaintext: payload.body_plaintext,
      body_ciphertext: payload.body_ciphertext,
      iv: payload.iv,
      key_version: payload.key_version,
    })
    .select("*")
    .single<MessageRow>();

  if (error || !inserted) {
    return { error: "Could not send message", status: 500 };
  }

  const now = new Date().toISOString();
  await admin
    .from("conversations")
    .update({ last_message_at: now })
    .eq("id", conv.id);
  // Sender implicitly reads their own message.
  await markRead({ conversationId: conv.id, userId: params.userId });

  const body = await decryptFromStorage(inserted as StoredMessageRow);
  const { body_plaintext: _omit, ...rest } = inserted;
  void _omit;
  return { ...rest, body };
}

/**
 * Aggregate unread count across all conversations for a user. Used by the
 * Header bell.
 */
export async function getTotalUnreadForUser(userId: string): Promise<number> {
  const items = await listConversationsForUser(userId);
  return items.reduce((sum, c) => sum + c.unread_count, 0);
}
