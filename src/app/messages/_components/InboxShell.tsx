import Link from "next/link";
import { ArrowLeft, Inbox, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ConversationListItem } from "@/lib/messaging/conversations";
import { cn } from "@/lib/utils";
import { MessageThreadClient, type ClientMessage } from "../MessageThreadClient";

type ActiveConversation = {
  id: string;
  listing_address: string | null;
  listing_thumb_url: string | null;
  perspective: "renter" | "landlord";
  other_email: string | null;
  initialMessages: ClientMessage[];
};

type Props = {
  conversations: ConversationListItem[];
  active: ActiveConversation | null;
  viewerUserId: string;
};

export function InboxShell({ conversations, active, viewerUserId }: Props) {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-4
        sm:px-5 sm:py-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.22em]
            text-muted-foreground"
        >
          Inbox
          {conversations.length > 0 ? (
            <span className="ml-2 text-muted-foreground/60">
              · {conversations.length}
            </span>
          ) : null}
        </p>
        <span
          className="hidden items-center gap-1.5 rounded-full border
            border-border bg-background/80 px-2.5 py-1 font-mono text-[10px]
            uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex"
        >
          <Lock className="size-3" aria-hidden />
          Encrypted in transit
        </span>
      </div>

      <div
        className="grid min-h-[520px] flex-1 grid-cols-1 overflow-hidden
          rounded-2xl border border-border bg-card
          md:grid-cols-[320px_1fr]"
      >
        <ConversationsRail conversations={conversations} activeId={active?.id} />
        <ThreadPane
          active={active}
          hasConversations={conversations.length > 0}
          viewerUserId={viewerUserId}
        />
      </div>
    </main>
  );
}

function ConversationsRail({
  conversations,
  activeId,
}: {
  conversations: ConversationListItem[];
  activeId: string | undefined;
}) {
  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-border bg-background/40",
        "border-b md:border-b-0 md:border-r",
        // On mobile, hide the rail when a conversation is active so the thread
        // gets the full screen — feels like an iMessage push to detail.
        activeId ? "hidden md:flex" : "flex"
      )}
    >
      <header
        className="flex items-center justify-between gap-2 border-b
          border-border px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Inbox className="size-4 text-muted-foreground" aria-hidden />
          <h2
            className="font-display text-[15px] leading-none tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            Messages
          </h2>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p
            className="px-4 py-6 text-center text-[13px] text-muted-foreground"
          >
            No conversations yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                c={c}
                active={c.id === activeId}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function ConversationRow({
  c,
  active,
}: {
  c: ConversationListItem;
  active: boolean;
}) {
  const other =
    c.other_email ?? (c.perspective === "renter" ? "Landlord" : "Renter");
  const initial = other.trim().charAt(0).toUpperCase() || "?";
  return (
    <li>
      <Link
        href={`/messages/${c.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex gap-3 border-l-2 border-transparent px-4 py-3",
          "transition-colors outline-none",
          "focus-visible:bg-muted/50",
          active
            ? "border-l-foreground bg-muted/60"
            : "hover:bg-muted/40"
        )}
      >
        {c.listing_thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.listing_thumb_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center
              rounded-xl bg-muted text-sm font-medium text-muted-foreground"
          >
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p
              className="min-w-0 flex-1 truncate text-[13.5px] font-medium
                text-foreground"
            >
              {c.listing_address ?? "Listing"}
            </p>
            {c.last_message_at ? (
              <span
                className="shrink-0 font-mono text-[10px] uppercase
                  tracking-[0.16em] text-muted-foreground/80"
              >
                {formatRailTime(c.last_message_at)}
              </span>
            ) : null}
          </div>
          <p
            className="mt-0.5 truncate text-[11.5px] text-muted-foreground"
          >
            <span
              className="font-mono uppercase tracking-[0.22em] text-[9px]
                text-muted-foreground/70"
            >
              {c.perspective === "renter" ? "Landlord" : "Renter"}
            </span>
            <span className="mx-1 text-muted-foreground/50">·</span>
            <span className="text-foreground/80">{other}</span>
          </p>
          <p
            className={cn(
              "mt-1 truncate text-[12.5px]",
              c.unread_count > 0
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {c.preview || "Conversation started"}
          </p>
        </div>
        {c.unread_count > 0 ? (
          <span
            className="mt-1 inline-flex h-5 min-w-5 shrink-0 items-center
              justify-center rounded-full bg-foreground px-1.5 font-mono
              text-[10px] font-medium text-background"
          >
            {c.unread_count}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function ThreadPane({
  active,
  hasConversations,
  viewerUserId,
}: {
  active: ActiveConversation | null;
  hasConversations: boolean;
  viewerUserId: string;
}) {
  if (!active) {
    return (
      <section
        className={cn(
          "flex min-h-0 flex-col bg-background",
          // Hide on mobile when no thread active — the rail above already
          // owns the screen.
          "hidden md:flex"
        )}
      >
        <Empty className="m-auto max-w-md border-0 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyTitle>
              {hasConversations
                ? "Select a conversation"
                : "No conversations yet"}
            </EmptyTitle>
            <EmptyDescription>
              {hasConversations
                ? "Pick a thread from the list to start replying."
                : "Conversations open automatically when a renter saves a listing."}
            </EmptyDescription>
          </EmptyHeader>
          {!hasConversations ? (
            <EmptyContent>
              <Button
                size="sm"
                render={<Link href="/listings" />}
                nativeButton={false}
              >
                Browse listings
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      </section>
    );
  }

  const otherLabel =
    active.other_email ??
    (active.perspective === "renter" ? "Landlord" : "Renter");
  const initial = otherLabel.trim().charAt(0).toUpperCase() || "?";

  return (
    <section className="flex min-h-0 flex-col bg-background">
      <header
        className="flex items-center gap-3 border-b border-border bg-card
          px-4 py-3 sm:px-5"
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 md:hidden"
          render={<Link href="/messages" />}
          nativeButton={false}
        >
          <ArrowLeft />
        </Button>

        {active.listing_thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.listing_thumb_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl bg-muted text-sm font-medium text-muted-foreground"
          >
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className="truncate font-display text-[15px] leading-tight
              tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {active.listing_address ?? "Listing"}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            <span
              className="font-mono uppercase tracking-[0.22em] text-[9px]"
            >
              {active.perspective === "renter" ? "Landlord" : "Renter"}
            </span>
            <span className="mx-1 text-muted-foreground/60">·</span>
            {otherLabel}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageThreadClient
          conversationId={active.id}
          viewerUserId={viewerUserId}
          initialMessages={active.initialMessages}
          variant="embedded"
        />
      </div>
    </section>
  );
}

function formatRailTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const diffMs = now.getTime() - d.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  if (diffMs < oneWeek) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
