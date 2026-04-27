import { Heart, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Inbox } from "lucide-react";

export type ApprovedListing = {
  id: string;
  address: string | null;
  neighborhood: string | null;
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
  rights: number;
  lefts: number;
};

export function ApprovedListings({
  listings,
}: {
  listings: ApprovedListing[];
}) {
  if (listings.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-card">
        <EmptyMedia variant="icon">
          <Inbox strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>No approved listings yet</EmptyTitle>
        <EmptyContent>
          Approved listings will appear here once you green-light a submission.
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <ApprovedCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

function ApprovedCard({ listing }: { listing: ApprovedListing }) {
  const cover = listing.photo_urls?.[0] ?? listing.video_url ?? null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-4/3 w-full bg-black">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            className="h-full w-full object-cover"
            alt={listing.address ?? "Listing photo"}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm
              text-[#fafaf8]/60"
          >
            No photo
          </div>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full
              bg-background/90 px-2 py-0.5 text-[11px] font-medium
              backdrop-blur"
          >
            <Heart className="size-3" />
            {listing.rights}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full
              bg-background/90 px-2 py-0.5 text-[11px] font-medium
              text-muted-foreground backdrop-blur"
          >
            <X className="size-3" />
            {listing.lefts}
          </span>
        </div>
      </div>
      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="font-display text-[17px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {listing.address ?? "(no address)"}
          </h3>
          <span className="text-[15px] font-medium">
            {listing.rent != null ? `$${listing.rent.toLocaleString()}` : "—"}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]
            text-muted-foreground"
        >
          {listing.neighborhood ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {listing.neighborhood}
            </span>
          ) : null}
          <span>
            {listing.bedrooms ?? "?"}BR · {listing.bathrooms ?? "?"} bath
          </span>
          <span>
            avail{" "}
            {listing.available_date
              ? new Date(listing.available_date).toLocaleDateString()
              : "soon"}
          </span>
        </div>
        {(listing.amenities ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(listing.amenities ?? []).slice(0, 6).map((a) => (
              <Badge key={a} variant="outline" className="font-normal">
                {a.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="truncate text-[11px] text-muted-foreground">
          {listing.landlord_email ?? "—"}
          {listing.landlord_phone ? ` · ${listing.landlord_phone}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
