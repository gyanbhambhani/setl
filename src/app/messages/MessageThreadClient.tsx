"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { cn } from "@/lib/utils";

export type ClientMessage = {
  id: string;
  from: "me" | "them" | "system";
  kind: "user" | "system";
  body: string;
  created_at: string;
};

type Props = {
  conversationId: string;
  /** Current auth user — maps Realtime rows to `from: me|them` without exposing UUIDs in the UI. */
  viewerUserId: string;
  initialMessages: ClientMessage[];
  /**
   * Slow safety-net `GET` while the tab is visible (missed WS events, tab
   * sleep, etc.). Primary delivery is Supabase Realtime `INSERT` on `messages`.
   * @default 120000
   */
  fallbackPollMs?: number;
  /**
   * "card" (default) is a self-contained bordered card; used on the standalone
   * thread page. "embedded" drops chrome so it can fill a parent inbox shell.
   */
  variant?: "card" | "embedded";
};

/** Map a Realtime `messages` row to the slim shape the thread UI uses. */
function realtimeRowToClientMessage(
  raw: Record<string, unknown>,
  viewerUserId: string,
  expectedConversationId: string
): ClientMessage | null {
  if (raw.conversation_id !== expectedConversationId) return null;
  const kind = raw.kind;
  if (kind !== "user" && kind !== "system") return null;
  const sender =
    typeof raw.sender_user_id === "string" ? raw.sender_user_id : null;
  const from: ClientMessage["from"] =
    kind === "system"
      ? "system"
      : sender === viewerUserId
        ? "me"
        : "them";
  const keyVersion =
    typeof raw.key_version === "number" ? raw.key_version : 0;
  const body =
    keyVersion === 0
      ? String(raw.body_plaintext ?? "")
      : "(encrypted message — open in a supported client)";
  return {
    id: String(raw.id),
    from,
    kind: kind as ClientMessage["kind"],
    body,
    created_at: String(raw.created_at),
  };
}

const TIME_SEPARATOR_MS = 30 * 60 * 1000;

export function MessageThreadClient({
  conversationId,
  viewerUserId,
  initialMessages,
  fallbackPollMs = 120_000,
  variant = "card",
}: Props) {
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ClientMessage[]>(initialMessages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  /** Supabase Realtime: push new rows in this conversation (RLS-scoped). */
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const filter = `conversation_id=eq.${conversationId}`;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg = realtimeRowToClientMessage(
            row,
            viewerUserId,
            conversationId
          );
          if (!msg) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, viewerUserId]);

  /**
   * Rare GET reconciliation — catches anything the socket missed (laptop sleep,
   * brief disconnect). Pauses when the tab is hidden.
   */
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const clearTimer = () => {
      if (timeoutId != undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const snapshotsEqual = (a: ClientMessage[], b: ClientMessage[]) => {
      if (a.length !== b.length) return false;
      const la = a[a.length - 1];
      const lb = b[b.length - 1];
      return la?.id === lb?.id;
    };

    const schedule = (ms: number) => {
      clearTimer();
      if (cancelled || document.visibilityState !== "visible") return;
      timeoutId = window.setTimeout(() => void tick(), ms);
    };

    const tick = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      clearTimer();
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ClientMessage[] };
        if (cancelled) return;
        const incoming = data.messages ?? [];
        const prev = messagesRef.current;
        if (!snapshotsEqual(incoming, prev)) {
          setMessages(incoming);
        }
      } catch {
        // ignore
      }
      schedule(fallbackPollMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearTimer();
        return;
      }
      void tick();
    };

    schedule(fallbackPollMs);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [conversationId, fallbackPollMs]);

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Could not send");
          return;
        }
        const data = (await res.json()) as { message: ClientMessage };
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setDraft("");
      } catch {
        setError("Network error — try again");
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const groups = useMemo(() => groupMessages(messages), [messages]);

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden",
        variant === "card"
          ? "mt-4 rounded-2xl border border-border bg-card"
          : "h-full bg-background"
      )}
    >
      <div
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5 sm:px-6",
          variant === "card" && "max-h-[62vh] min-h-[360px]"
        )}
      >
        {messages.length === 0 ? (
          <p
            className="m-auto max-w-xs text-center text-sm text-muted-foreground"
          >
            No messages yet. Say hi.
          </p>
        ) : (
          groups.map((group, gi) => {
            if (group.kind === "time") {
              return <TimeSeparator key={`t-${gi}`} ts={group.ts} />;
            }
            if (group.kind === "system") {
              return (
                <div
                  key={`s-${group.messages[0].id}`}
                  className="my-1 flex justify-center"
                >
                  <span
                    className="rounded-full border border-border bg-background
                      px-3 py-1 font-mono text-[10px] uppercase
                      tracking-[0.22em] text-muted-foreground"
                  >
                    {group.messages[0].body}
                  </span>
                </div>
              );
            }
            // user-group: same sender, contiguous
            const isMe = group.from === "me";
            return (
              <div
                key={`g-${group.messages[0].id}`}
                className={cn(
                  "flex flex-col gap-1",
                  isMe ? "items-end" : "items-start",
                  gi === 0 ? "mt-0" : "mt-3"
                )}
              >
                {group.messages.map((m, i) => {
                  const first = i === 0;
                  const last = i === group.messages.length - 1;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[78%] px-3.5 py-2 text-[14px] leading-[1.45]",
                        "wrap-break-word whitespace-pre-wrap",
                        isMe
                          ? "bg-foreground text-background"
                          : "border border-border bg-background text-foreground",
                        // iMessage-style stacked corners
                        first && last && (isMe
                          ? "rounded-2xl rounded-br-md"
                          : "rounded-2xl rounded-bl-md"),
                        first && !last && (isMe
                          ? "rounded-t-2xl rounded-l-2xl rounded-br-md"
                          : "rounded-t-2xl rounded-r-2xl rounded-bl-md"),
                        !first && !last && (isMe
                          ? "rounded-l-2xl rounded-r-md"
                          : "rounded-r-2xl rounded-l-md"),
                        !first && last && (isMe
                          ? "rounded-b-2xl rounded-l-2xl rounded-tr-md"
                          : "rounded-b-2xl rounded-r-2xl rounded-tl-md")
                      )}
                    >
                      {m.body}
                    </div>
                  );
                })}
                <span
                  className={cn(
                    "px-1 text-[10px] uppercase tracking-[0.18em]",
                    "text-muted-foreground/80 font-mono"
                  )}
                >
                  {formatGroupTime(
                    group.messages[group.messages.length - 1].created_at
                  )}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex flex-col gap-2 border-t border-border bg-background/60
          px-4 py-3 sm:px-6"
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder="Write a message…"
          className="min-h-[64px] resize-none border-transparent bg-transparent
            px-0 shadow-none focus-visible:border-transparent
            focus-visible:ring-0"
          disabled={sending}
          maxLength={4000}
        />
        <div
          className="flex flex-wrap items-center justify-between gap-3
            border-t border-dashed border-border/70 pt-2"
        >
          <p
            className="flex items-center gap-1.5 text-[10px] uppercase
              tracking-[0.22em] text-muted-foreground/80 font-mono"
          >
            <Lock className="size-3" aria-hidden />
            Encrypted in transit · E2EE soon
          </p>
          <div className="flex items-center gap-3">
            {error ? (
              <span className="text-[12px] text-destructive">{error}</span>
            ) : null}
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]
                text-muted-foreground/70"
            >
              ⌘↵
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={sending || !draft.trim()}
            >
              {sending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send aria-hidden />
              )}
              Send
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

type Group =
  | { kind: "time"; ts: string }
  | { kind: "system"; messages: ClientMessage[] }
  | { kind: "user"; from: "me" | "them"; messages: ClientMessage[] };

function groupMessages(messages: ClientMessage[]): Group[] {
  const out: Group[] = [];
  let prevTs: number | null = null;
  let cur: Group | null = null;
  for (const m of messages) {
    const t = new Date(m.created_at).getTime();
    if (prevTs == null || t - prevTs > TIME_SEPARATOR_MS) {
      if (cur) out.push(cur);
      out.push({ kind: "time", ts: m.created_at });
      cur = null;
    }
    prevTs = t;

    if (m.from === "system" || m.kind === "system") {
      if (cur) out.push(cur);
      out.push({ kind: "system", messages: [m] });
      cur = null;
      continue;
    }

    if (
      cur &&
      cur.kind === "user" &&
      cur.from === m.from &&
      // Break a group if more than 5 minutes elapse between same-sender msgs.
      t - new Date(cur.messages[cur.messages.length - 1].created_at).getTime() <
        5 * 60 * 1000
    ) {
      cur.messages.push(m);
    } else {
      if (cur) out.push(cur);
      cur = {
        kind: "user",
        from: m.from === "me" ? "me" : "them",
        messages: [m],
      };
    }
  }
  if (cur) out.push(cur);
  return out;
}

function TimeSeparator({ ts }: { ts: string }) {
  return (
    <div className="my-2 flex items-center justify-center">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.22em]
          text-muted-foreground/70"
      >
        {formatSeparator(ts)}
      </span>
    </div>
  );
}

function formatSeparator(ts: string): string {
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
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGroupTime(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
