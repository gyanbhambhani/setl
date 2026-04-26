"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
      <div
        className="rounded-2xl border border-hairline bg-surface p-6 text-sm
          text-muted"
      >
        No pending listings. Inbox zero.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <div className="bg-black aspect-video w-full">
        {cover ? (
          <img
            src={cover}
            className="h-full w-full object-cover"
            alt="Listing photo"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#fafaf8]/60">
            No photo
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[16px] font-semibold tracking-tight">
            {listing.address ?? "(no address)"}
          </h3>
          <span className="text-[15px] font-medium">
            {listing.rent != null ? `$${listing.rent.toLocaleString()}` : "—"}
          </span>
        </div>
        <p className="text-[13px] text-muted">
          {listing.bedrooms ?? "?"}BR · {listing.bathrooms ?? "?"} bath ·
          {" "}
          available{" "}
          {listing.available_date
            ? new Date(listing.available_date).toLocaleDateString()
            : "soon"}
        </p>
        <p className="text-[12px] text-muted">
          {listing.landlord_email ?? ""}
          {listing.landlord_phone ? ` · ${listing.landlord_phone}` : ""}
        </p>
        {(listing.amenities ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(listing.amenities ?? []).map((a) => (
              <span
                key={a}
                className="rounded-full border border-hairline px-2.5 py-0.5 text-[11px] text-foreground/70"
              >
                {a.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : null}

        {done ? (
          <p className="text-sm text-accent-hover">
            Marked as {done}. Refresh to drop from queue.
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => update("approved")}
              disabled={pending}
              className="h-9 flex-1 rounded-full bg-accent text-sm font-medium text-[#fafaf8] hover:bg-accent-hover disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => update("rejected")}
              disabled={pending}
              className="h-9 flex-1 rounded-full border border-hairline text-sm font-medium text-foreground hover:border-foreground/40 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
