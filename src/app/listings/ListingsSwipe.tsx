"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

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
      <EmptyState
        title="More verified listings coming soon"
        body="We&rsquo;ll email you the moment a place fits your preferences."
      />
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
      <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-4">
        <ActionButton
          label="Pass"
          onClick={() => handleSwipe(top, "left")}
          tone="muted"
        />
        <ActionButton
          label="Save"
          onClick={() => handleSwipe(top, "right")}
          tone="accent"
        />
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
          className="absolute left-5 top-5 rounded-full border-2 border-accent
            bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase
            tracking-widest text-accent-hover"
        >
          Save
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="absolute right-5 top-5 rounded-full border-2 border-foreground/40
            bg-background px-3 py-1 font-mono text-[11px] uppercase
            tracking-widest text-foreground/80"
        >
          Pass
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
        "relative flex h-full w-full flex-col overflow-hidden rounded-[28px]" +
        " border border-hairline bg-surface shadow-[0_30px_80px_-40px_rgba(26,26,26,0.25)]" +
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
                "radial-gradient(60% 50% at 30% 30%, #5c7a5c 0%, #1a1a1a 70%)",
            }}
          />
        )}
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-2
            rounded-full bg-black/45 px-3 py-1 font-mono text-[10px]
            uppercase tracking-widest text-[#fafaf8] backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Verified
        </span>
        {children}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[19px] font-semibold tracking-tight">
            {listing.bedrooms ?? "?"}BR · {listing.neighborhood ?? "Berkeley"}
          </h3>
          <span className="text-[18px] font-medium tracking-tight">
            {listing.rent != null
              ? `$${listing.rent.toLocaleString()}`
              : "—"}
          </span>
        </div>
        <p className="text-[13px] text-muted">
          {listing.address ?? "Address available after intro"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Tag>{listing.bathrooms ?? "?"} bath</Tag>
          {listing.available_date ? (
            <Tag>
              Available{" "}
              {new Date(listing.available_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Tag>
          ) : null}
          {(listing.amenities ?? []).slice(0, 2).map((a) => (
            <Tag key={a}>{a.replace(/_/g, " ")}</Tag>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full border border-hairline px-2.5 py-1 text-[11px]
        uppercase tracking-wide text-foreground/70"
    >
      {children}
    </span>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "muted" | "accent";
  onClick: () => void;
}) {
  const cls =
    tone === "accent"
      ? "border-accent bg-accent text-[#fafaf8]"
      : "border-hairline bg-surface text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 w-32 rounded-full border text-sm font-medium ${cls}`}
    >
      {label}
    </button>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4
        rounded-[28px] border border-hairline bg-surface px-8 py-16 text-center"
    >
      <span
        className="font-mono text-[11px] uppercase tracking-widest text-muted"
      >
        Setl
      </span>
      <h2 className="text-[24px] font-semibold tracking-tight">{title}</h2>
      <p className="max-w-sm text-[14px] leading-[1.6] text-muted">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full
            bg-accent px-5 text-sm font-medium text-[#fafaf8] hover:bg-accent-hover"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
