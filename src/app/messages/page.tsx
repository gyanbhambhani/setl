import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { listConversationsForUser } from "@/lib/messaging/conversations";
import { getSession } from "@/lib/supabaseServer";
import { InboxShell } from "./_components/InboxShell";

export const metadata = { title: "Messages — Setl" };
export const dynamic = "force-dynamic";

export default async function MessagesInboxPage() {
  const user = await getSession();
  if (!user) redirect("/login?redirect=/messages");

  const conversations = await listConversationsForUser(user.id);
  // iMessage-style: open the latest conversation by default. The list is
  // already sorted by `last_message_at desc`.
  if (conversations.length > 0) {
    redirect(`/messages/${conversations[0].id}`);
  }

  return (
    <>
      <Header />
      <InboxShell conversations={[]} active={null} />
    </>
  );
}
