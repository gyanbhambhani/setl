import Link from "next/link";
import { ArrowRight, Heart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LandlordListingsClient } from "./LandlordListingsClient";
import type {
  LandlordListingActivity,
  RenterProfileRow,
  RenterSwipeRow,
} from "./loadDashboard";

export function LandlordPanel({
  listings,
}: {
  listings: LandlordListingActivity[];
}) {
  const stats = computeLandlordStats(listings);

  return (
    <section id="landlord" className="scroll-mt-24">
      <SectionHeader
        eyebrow="Landlord"
        title="Your listings"
        description="Submissions and renter swipe activity on each place."
      />

      {listings.length > 0 ? (
        <Card className="mt-6 p-0">
          <CardContent className="px-5 py-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Listings" value={stats.total} />
              <StatTile
                label="Approved"
                value={stats.approved}
                hint={
                  stats.pending > 0
                    ? `${stats.pending} pending`
                    : undefined
                }
              />
              <StatTile label="Total swipes" value={stats.swipes} />
              <StatTile
                label="Saves"
                value={stats.saves}
                accent
                hint={
                  stats.swipes > 0
                    ? `${stats.conversion}% save rate`
                    : undefined
                }
              />
              <StatTile label="Passes" value={stats.passes} />
              <StatTile
                label="Awaiting reply"
                value={stats.notifiedSaves}
                hint="Renter saves emailed to you"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <LandlordListingsClient listings={listings} />

      {listings.length > 0 ? (
        <div className="mt-6">
          <Button
            variant="outline"
            render={<Link href="/for-landlords/onboard" />}
            nativeButton={false}
          >
            Submit another listing
          </Button>
        </div>
      ) : null}
    </section>
  );
}

type LandlordStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  swipes: number;
  saves: number;
  passes: number;
  conversion: number;
  notifiedSaves: number;
};

function computeLandlordStats(
  listings: LandlordListingActivity[]
): LandlordStats {
  let approved = 0;
  let pending = 0;
  let rejected = 0;
  let swipes = 0;
  let saves = 0;
  let passes = 0;
  for (const L of listings) {
    if (L.status === "approved") approved += 1;
    else if (L.status === "pending") pending += 1;
    else if (L.status === "rejected") rejected += 1;
    const rows = L.matches ?? [];
    swipes += rows.length;
    for (const m of rows) {
      if (m.direction === "right") saves += 1;
      else if (m.direction === "left") passes += 1;
    }
  }
  return {
    total: listings.length,
    approved,
    pending,
    rejected,
    swipes,
    saves,
    passes,
    conversion: swipes > 0 ? Math.round((saves / swipes) * 100) : 0,
    notifiedSaves: saves,
  };
}

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border px-4 py-3 " +
        (accent
          ? "border-brand/40 bg-brand-soft text-brand-ink"
          : "border-border bg-card")
      }
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em]
          text-muted-foreground"
      >
        {label}
      </p>
      <p
        className="mt-1 font-display text-[24px] leading-none tracking-tight"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function RenterPanel({
  profile,
  rows,
}: {
  profile: RenterProfileRow | null;
  rows: RenterSwipeRow[];
}) {
  const saved = rows.filter((r) => r.direction === "right").length;
  const passed = rows.filter((r) => r.direction === "left").length;

  return (
    <section id="renter" className="scroll-mt-24">
      <SectionHeader
        eyebrow="Renter"
        title="Your search"
        description="Preferences and every swipe you've made on Browse."
      />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <ProfileItem
                  label="Budget"
                  value={
                    profile.budget_min != null && profile.budget_max != null
                      ? `$${profile.budget_min}–$${profile.budget_max}`
                      : "—"
                  }
                />
                <ProfileItem
                  label="Move date"
                  value={profile.move_date ?? "—"}
                />
                <ProfileItem
                  label="Roommates"
                  value={String(profile.roommates ?? "—")}
                />
                <ProfileItem
                  label="Neighborhoods"
                  value={(profile.neighborhoods ?? []).join(", ") || "—"}
                />
                <ProfileItem
                  label="Dealbreakers"
                  value={(profile.dealbreakers ?? []).join(", ") || "—"}
                />
                <ProfileItem
                  label="Ideal place"
                  value={profile.description ?? "—"}
                />
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                You haven&rsquo;t completed renter onboarding yet.
              </p>
            )}
            <div className="mt-5">
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/for-renters/onboard" />}
                nativeButton={false}
              >
                {profile ? "Update preferences" : "Set preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Swipe summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <StatPill label="Saved" value={saved} accent />
              <StatPill label="Passed" value={passed} />
              <StatPill label="Total swipes" value={rows.length} />
            </div>
            <div className="mt-5">
              <Button
                size="sm"
                render={<Link href="/listings" />}
                nativeButton={false}
              >
                Browse listings
                <ArrowRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 p-0">
        <CardHeader className="border-b px-5 pb-4 pt-4">
          <CardTitle>Swipe activity</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <p
              className="px-5 py-10 text-center text-sm text-muted-foreground"
            >
              {profile
                ? "No swipes yet. Open Browse to start."
                : "Complete preferences, then browse listings to swipe."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Action</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Layout</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead className="pr-5">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const Li = r.listings;
                    const thumb =
                      Li?.photo_urls?.[0] ?? Li?.video_url ?? null;
                    return (
                      <TableRow key={`${r.listing_id}-${r.created_at}`}>
                        <TableCell className="pl-5">
                          {r.direction === "right" ? (
                            <Badge
                              className="bg-brand-soft text-brand-ink"
                              variant="outline"
                            >
                              <Heart className="size-3" /> Saved
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <X className="size-3" /> Passed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="size-9 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <span
                                className="size-9 shrink-0 rounded-lg bg-muted"
                              />
                            )}
                            <span className="max-w-[200px] truncate">
                              {Li?.address ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {Li?.rent != null
                            ? `$${Li.rent.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {Li
                            ? `${Li.bedrooms ?? "?"}BR · ${
                                Li.bathrooms ?? "?"
                              } bath`
                            : "—"}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {Li?.status ?? "—"}
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap pr-5
                            text-muted-foreground"
                        >
                          {new Date(r.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p
        className="font-mono text-[11px] uppercase tracking-[0.22em]
          text-muted-foreground"
      >
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-display text-[28px] leading-[1.1] tracking-tight"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {title}
      </h2>
      <p className="mt-2 text-[14px] text-muted-foreground">{description}</p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em]
          text-muted-foreground"
      >
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-full border px-4 py-1.5 text-sm " +
        (accent
          ? "border-brand/30 bg-brand-soft text-brand-ink"
          : "border-border bg-card text-foreground")
      }
    >
      <span className="text-muted-foreground">{label}</span>{" "}
      <strong className="text-foreground">{value}</strong>
    </div>
  );
}
