"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Inbox } from "lucide-react";

export type AdminListing = {
  id: string;
  address: string | null;
  rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  video_url: string | null;
  photo_urls?: string[] | null;
  amenities: string[] | null;
  available_date: string | null;
  landlord_email: string | null;
  landlord_phone: string | null;
  status: string;
  created_at: string;
};

export function AdminListings({ listings }: { listings: AdminListing[] }) {
  if (listings.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-card">
        <EmptyMedia variant="icon">
          <Inbox strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>Inbox zero</EmptyTitle>
        <EmptyContent>No pending listings to review.</EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {listings.map((l) => (
        <PendingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

function PendingCard({ listing }: { listing: AdminListing }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  async function update(status: "approved" | "rejected") {
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(status);
      startTransition(() => router.refresh());
    } catch {
      setError("Could not update.");
    }
  }

  const cover = listing.photo_urls?.[0] ?? listing.video_url ?? null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-video w-full bg-black">
        {cover ? (
          <img
            src={cover}
            className="h-full w-full object-cover"
            alt="Listing photo"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm
              text-[#fafaf8]/60"
          >
            No photo
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-3 px-5 py-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="font-display text-[18px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {listing.address ?? "(no address)"}
          </h3>
          <span className="text-[15px] font-medium">
            {listing.rent != null ? `$${listing.rent.toLocaleString()}` : "—"}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {listing.bedrooms ?? "?"}BR · {listing.bathrooms ?? "?"} bath ·
          available{" "}
          {listing.available_date
            ? new Date(listing.available_date).toLocaleDateString()
            : "soon"}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {listing.landlord_email ?? ""}
          {listing.landlord_phone ? ` · ${listing.landlord_phone}` : ""}
        </p>
        {(listing.amenities ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(listing.amenities ?? []).map((a) => (
              <Badge key={a} variant="outline" className="font-normal">
                {a.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        ) : null}

        {done ? (
          <p
            className="mt-1 inline-flex items-center gap-1.5 text-sm
              text-brand-ink"
          >
            <CheckCircle2 className="size-4" />
            Marked as {done}.
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              onClick={() => update("approved")}
              disabled={pending}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => update("rejected")}
              disabled={pending}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        )}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
