import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import {
  getConversation,
  listConversationsForUser,
} from "@/lib/messaging/conversations";
import { getSession } from "@/lib/supabaseServer";
import { InboxShell } from "../_components/InboxShell";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Conversation — Setl" };
export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=/messages/${id}`);
  if (!UUID_RE.test(id)) redirect("/messages");

  const [thread, conversations] = await Promise.all([
    getConversation({ conversationId: id, userId: user.id }),
    listConversationsForUser(user.id),
  ]);
  if (!thread) redirect("/messages");

  // Strip raw auth UUIDs out of the page → client payload. The client only
  // needs to know whether each message is "me", "them", or "system".
  const initialMessages = thread.messages.map((m) => ({
    id: m.id,
    from:
      m.kind === "system"
        ? ("system" as const)
        : m.sender_user_id === user.id
          ? ("me" as const)
          : ("them" as const),
    kind: m.kind,
    body: m.body,
    created_at: m.created_at,
  }));

  const otherEmail =
    thread.perspective === "renter"
      ? thread.conversation.landlord_email
      : thread.conversation.renter_email;

  return (
    <>
      <Header />
      <InboxShell
        conversations={conversations}
        active={{
          id: thread.conversation.id,
          listing_address: thread.conversation.listing_address,
          listing_thumb_url: thread.conversation.listing_thumb_url,
          perspective: thread.perspective,
          other_email: otherEmail,
          initialMessages,
        }}
      />
    </>
  );
}
