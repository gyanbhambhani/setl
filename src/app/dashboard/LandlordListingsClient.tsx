"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronDown,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyMedia } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LandlordListingActivity } from "./loadDashboard";

type Props = {
  listings: LandlordListingActivity[];
  /** `${listing_id}::${renter_user_id}` -> conversation_id */
  conversationsByMatchKey?: Record<string, string>;
};

export function LandlordListingsClient({
  listings,
  conversationsByMatchKey,
}: Props) {
  if (listings.length === 0) {
    return (
      <Empty className="mt-6">
        <EmptyMedia variant="icon">
          <Building2 strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyContent>
          <p className="font-medium">No listings yet.</p>
          <p className="text-muted-foreground">
            Submit a place to see saves, passes, and renter interest.
          </p>
          <Button
            className="mt-4"
            render={<Link href="/for-landlords/onboard" />}
            nativeButton={false}
          >
            Submit a listing
            <ArrowRight />
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {listings.map((L) => (
        <ListingRow
          key={L.id}
          listing={L}
          conversationsByMatchKey={conversationsByMatchKey}
        />
      ))}
    </div>
  );
}

function ListingRow({
  listing: L,
  conversationsByMatchKey,
}: {
  listing: LandlordListingActivity;
  conversationsByMatchKey?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = L.matches ?? [];
  const saves = rows.filter((m) => m.direction === "right");
  const passes = rows.filter((m) => m.direction === "left");
  const conversion =
    rows.length > 0 ? Math.round((saves.length / rows.length) * 100) : 0;
  const thumb = L.photo_urls?.[0] ?? L.video_url ?? null;

  async function handleDelete() {
    const ok = window.confirm(
      `Permanently remove this listing?\n\n${L.address ?? "Listing"}\n\n` +
        "This will also clear renter swipes for this place. " +
        "This cannot be undone."
    );
    if (!ok) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${L.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      setDeleting(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-4 text-left
          transition-colors hover:bg-muted/40 sm:px-5"
        aria-expanded={open}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20
              sm:w-28"
          />
        ) : (
          <div
            className="h-16 w-20 shrink-0 rounded-lg bg-muted sm:h-20 sm:w-28"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate font-display text-[16px] leading-tight
                tracking-tight sm:text-[18px]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              {L.address ?? "Listing"}
            </h3>
            <StatusBadge status={L.status} />
          </div>
          <p
            className="mt-1 truncate text-[12px] text-muted-foreground
              sm:text-[13px]"
          >
            {L.rent != null ? `$${L.rent.toLocaleString()}/mo` : "—"} ·{" "}
            {L.bedrooms ?? "?"}BR · {L.bathrooms ?? "?"} bath · Submitted{" "}
            {new Date(L.created_at).toLocaleDateString()}
          </p>
          <div
            className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1
              text-[12px]"
          >
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3 text-brand" />
              <strong>{saves.length}</strong>
              <span className="text-muted-foreground">saves</span>
            </span>
            <span
              className="inline-flex items-center gap-1 text-muted-foreground"
            >
              <X className="size-3" />
              <strong className="text-foreground">{passes.length}</strong>{" "}
              passes
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">{conversion}%</strong>{" "}
              save rate
            </span>
          </div>
        </div>
        <ChevronDown
          className={
            "size-4 shrink-0 text-muted-foreground transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open ? (
        <CardContent
          className="border-t bg-card/40 px-4 py-5 sm:px-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailItem
              icon={<MapPin className="size-3.5" />}
              label="Neighborhood"
              value={L.neighborhood ?? "—"}
            />
            <DetailItem
              icon={<Calendar className="size-3.5" />}
              label="Available"
              value={
                L.available_date
                  ? new Date(L.available_date).toLocaleDateString()
                  : "—"
              }
            />
            <DetailItem
              icon={<Mail className="size-3.5" />}
              label="Landlord email"
              value={L.landlord_email ?? "—"}
            />
            <DetailItem
              icon={<Phone className="size-3.5" />}
              label="Landlord phone"
              value={L.landlord_phone ?? "—"}
            />
          </div>

          {(L.amenities ?? []).length > 0 ? (
            <div className="mt-5">
              <Label>Amenities</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(L.amenities ?? []).map((a) => (
                  <Badge key={a} variant="outline" className="font-normal">
                    {a.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {(L.photo_urls ?? []).length > 1 ? (
            <div className="mt-5">
              <Label>Photos</Label>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {(L.photo_urls ?? []).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${L.id}-photo-${i}`}
                    src={url}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <Label>
              Renters who saved this listing ({saves.length})
            </Label>
            {saves.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted-foreground">
                No saves yet.
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Saved</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Move</TableHead>
                      <TableHead>Areas</TableHead>
                      <TableHead>Reply</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saves.map((m, i) => {
                      const renterUserId = m.renters?.user_id ?? null;
                      const convId = renterUserId
                        ? conversationsByMatchKey?.[
                            `${L.id}::${renterUserId}`
                          ]
                        : undefined;
                      return (
                        <TableRow key={`${L.id}-save-${m.created_at}-${i}`}>
                          <TableCell
                            className="whitespace-nowrap text-muted-foreground"
                          >
                            {new Date(m.created_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>{formatBudget(m.renters)}</TableCell>
                          <TableCell>
                            {m.renters?.move_date ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {(m.renters?.neighborhoods ?? []).join(", ") ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            {convId ? (
                              <Link
                                href={`/messages/${convId}`}
                                className="inline-flex items-center gap-1
                                  text-[12px] font-medium text-foreground
                                  underline underline-offset-4
                                  hover:text-brand-ink"
                              >
                                <MessageCircle className="size-3" />
                                Reply
                              </Link>
                            ) : (
                              <span className="text-[12px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-between
              gap-3 border-t pt-5"
          >
            <p className="text-[12px] text-muted-foreground">
              Need to edit details? Email{" "}
              <Link
                href="mailto:hello@setl.house"
                className="underline underline-offset-4"
              >
                hello@setl.house
              </Link>{" "}
              and we&rsquo;ll update it.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || pending}
            >
              {deleting || pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Remove listing
            </Button>
          </div>
          {error ? (
            <p
              className="mt-2 text-right text-[12px] text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "border-brand/40 bg-brand-soft text-brand-ink",
    pending: "border-border bg-muted text-foreground",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  const cls = map[status] ?? "border-border bg-card text-foreground";
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 " +
        "text-[11px] font-medium capitalize " +
        cls
      }
    >
      {status}
    </span>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label>
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </Label>
      <p className="mt-1 wrap-break-word text-sm text-foreground">{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono text-[10px] uppercase tracking-[0.22em]
        text-muted-foreground"
    >
      {children}
    </p>
  );
}

function formatBudget(
  renter: {
    budget_min: number | null;
    budget_max: number | null;
  } | null
): string {
  if (!renter) return "—";
  if (renter.budget_min != null && renter.budget_max != null) {
    return `$${renter.budget_min}–$${renter.budget_max}`;
  }
  return "—";
}
