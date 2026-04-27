"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Heart, Inbox, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type Listing = {
  id: string;
  address: string | null;
  rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  video_url: string | null;
  photo_urls?: string[] | null;
  amenities: string[] | null;
  available_date: string | null;
  neighborhood?: string | null;
};

const SWIPE_THRESHOLD = 110;

export function ListingsSwipe({ listings }: { listings: Listing[] }) {
  const [stack, setStack] = useState<Listing[]>(listings);

  async function recordMatch(listingId: string, dir: "left" | "right") {
    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          direction: dir,
        }),
      });
    } catch {
      // best-effort
    }
  }

  function handleSwipe(listing: Listing, dir: "left" | "right") {
    void recordMatch(listing.id, dir);
    setStack((s) => s.filter((l) => l.id !== listing.id));
  }

  if (stack.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-card">
        <EmptyMedia variant="icon">
          <Inbox strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>More verified listings coming soon</EmptyTitle>
        <EmptyContent>
          We&rsquo;ll email you the moment a place fits your preferences.
        </EmptyContent>
      </Empty>
    );
  }

  const top = stack[stack.length - 1];
  const beneath = stack.slice(0, -1).slice(-2);

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-md">
      {beneath.map((l, i) => {
        const offset = beneath.length - i;
        return (
          <div
            key={l.id}
            className="absolute inset-0 origin-top"
            style={{
              transform: `translateY(${offset * 10}px) scale(${
                1 - offset * 0.03
              })`,
              opacity: 1 - offset * 0.15,
              zIndex: i,
            }}
          >
            <Card listing={l} interactive={false} />
          </div>
        );
      })}
      <AnimatePresence>
        <SwipeableCard
          key={top.id}
          listing={top}
          onSwipe={(dir) => handleSwipe(top, dir)}
        />
      </AnimatePresence>
      <div
        className="absolute -bottom-20 left-0 right-0 flex items-center
          justify-center gap-3"
      >
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-32 rounded-full"
          onClick={() => handleSwipe(top, "left")}
        >
          <X /> Pass
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 w-32 rounded-full"
          onClick={() => handleSwipe(top, "right")}
        >
          <Heart /> Save
        </Button>
      </div>
    </div>
  );
}

function SwipeableCard({
  listing,
  onSwipe,
}: {
  listing: Listing;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -40], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          onSwipe("right");
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          onSwipe("left");
        }
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: 0, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <Card listing={listing} interactive>
        <motion.span
          style={{ opacity: likeOpacity }}
          className="absolute left-5 top-5 inline-flex items-center gap-1.5
            rounded-full border-2 border-brand bg-brand-soft px-3 py-1
            font-mono text-[11px] uppercase tracking-[0.22em] text-brand-ink"
        >
          <Heart className="size-3" /> Save
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="absolute right-5 top-5 inline-flex items-center gap-1.5
            rounded-full border-2 border-foreground/40 bg-background px-3
            py-1 font-mono text-[11px] uppercase tracking-[0.22em]
            text-foreground/80"
        >
          <X className="size-3" /> Pass
        </motion.span>
      </Card>
    </motion.div>
  );
}

function Card({
  listing,
  interactive,
  children,
}: {
  listing: Listing;
  interactive: boolean;
  children?: React.ReactNode;
}) {
  const cover = listing.photo_urls?.[0] ?? listing.video_url ?? null;
  return (
    <div
      className={
        "relative flex h-full w-full flex-col overflow-hidden rounded-3xl" +
        " border border-border bg-card" +
        " shadow-[0_30px_80px_-40px_rgba(26,26,26,0.25)]" +
        (interactive ? " cursor-grab active:cursor-grabbing" : "")
      }
    >
      <div className="relative flex-1 bg-black">
        {cover ? (
          <img
            className="h-full w-full object-cover"
            src={cover}
            alt="Listing photo"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 30% 30%, #5c7a5c 0%, " +
                "#1a1a1a 70%)",
            }}
          />
        )}
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5
            rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px]
            uppercase tracking-[0.22em] text-[#fafaf8] backdrop-blur-sm"
        >
          <ShieldCheck className="size-3" /> Verified
        </span>
        {children}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-display text-[20px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {listing.bedrooms ?? "?"}BR · {listing.neighborhood ?? "Berkeley"}
          </h3>
          <span className="text-[18px] font-medium tracking-tight">
            {listing.rent != null ? `$${listing.rent.toLocaleString()}` : "—"}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {listing.address ?? "Address available after intro"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="font-normal">
            {listing.bathrooms ?? "?"} bath
          </Badge>
          {listing.available_date ? (
            <Badge variant="outline" className="font-normal">
              Available{" "}
              {new Date(listing.available_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Badge>
          ) : null}
          {(listing.amenities ?? []).slice(0, 3).map((a) => (
            <Badge variant="outline" className="font-normal" key={a}>
              {a.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
