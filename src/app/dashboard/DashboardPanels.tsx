import Link from "next/link";
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
  if (listings.length === 0) return null;

  return (
    <section
      id="landlord"
      className="scroll-mt-24 rounded-2xl border border-hairline bg-surface"
    >
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="text-[17px] font-semibold tracking-tight">
          Your listings
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Submissions and renter swipe activity on each place. &ldquo;Swipes&rdquo;
          counts renters who saw your card and chose left or right.
        </p>
      </div>
      <div className="divide-y divide-hairline">
        {listings.map((L) => (
          <LandlordListingCard key={L.id} listing={L} />
        ))}
      </div>
      <div className="border-t border-hairline px-5 py-4">
        <Link
          href="/for-landlords/onboard"
          className="text-[13px] font-medium text-accent underline-offset-4 hover:underline"
        >
          Submit another listing →
        </Link>
      </div>
    </section>
  );
}

function LandlordListingCard({ listing: L }: { listing: LandlordListingActivity }) {
  const rows = L.matches ?? [];
  const saves = rows.filter((m) => m.direction === "right");
  const passes = rows.filter((m) => m.direction === "left");
  const thumb = L.photo_urls?.[0] ?? L.video_url ?? null;

  return (
    <div className="px-5 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="h-24 w-36 shrink-0 rounded-xl object-cover sm:h-28 sm:w-40"
          />
        ) : (
          <div className="h-24 w-36 shrink-0 rounded-xl bg-hairline sm:h-28 sm:w-40" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-semibold tracking-tight">
              {L.address ?? "Listing"}
            </h3>
            <span className="rounded-full border border-hairline px-2 py-0.5 text-[11px] font-medium capitalize text-muted">
              {L.status}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {L.rent != null ? `$${L.rent.toLocaleString()}/mo` : "—"} ·{" "}
            {L.bedrooms ?? "?"}BR · {L.bathrooms ?? "?"} bath · Submitted{" "}
            {new Date(L.created_at).toLocaleDateString()}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill label="Swipes" value={rows.length} />
            <StatPill label="Saves" value={saves.length} accent />
            <StatPill label="Passes" value={passes.length} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-[13px] font-semibold tracking-tight text-foreground">
          Renters who saved this listing
        </h4>
        {saves.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">
            No saves yet. When your listing is approved, renters can swipe on
            it in Browse.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline text-sm">
              <thead className="text-left text-[11px] uppercase tracking-widest text-muted">
                <tr>
                  <th className="py-2 pr-4">Saved</th>
                  <th className="py-2 pr-4">Budget</th>
                  <th className="py-2 pr-4">Move</th>
                  <th className="py-2">Areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {saves.map((m, i) => (
                  <tr key={`${L.id}-save-${m.created_at}-${i}`}>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted">
                      {new Date(m.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 pr-4">{formatBudgetCell(m.renters)}</td>
                    <td className="py-2 pr-4">
                      {m.renters?.move_date ?? "—"}
                    </td>
                    <td className="py-2 text-muted">
                      {(m.renters?.neighborhoods ?? []).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBudgetCell(
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
    <section
      id="renter"
      className="scroll-mt-24 rounded-2xl border border-hairline bg-surface"
    >
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="text-[17px] font-semibold tracking-tight">
          Renter profile &amp; swipes
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Your search preferences and every swipe on Browse.
        </p>
      </div>

      <div className="border-b border-hairline px-5 py-6">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
          Profile
        </h3>
        {profile ? (
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <ProfileItem
              label="Budget"
              value={
                profile.budget_min != null && profile.budget_max != null
                  ? `$${profile.budget_min}–$${profile.budget_max}`
                  : "—"
              }
            />
            <ProfileItem label="Move date" value={profile.move_date ?? "—"} />
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
          <p className="mt-3 text-[13px] text-muted">
            You have not completed renter onboarding yet.
          </p>
        )}
        <Link
          href="/for-renters/onboard"
          className="mt-4 inline-block text-[13px] font-medium text-accent underline-offset-4 hover:underline"
        >
          {profile ? "Update preferences →" : "Set preferences →"}
        </Link>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <StatPill label="Saved" value={saved} accent />
          <StatPill label="Passed" value={passed} />
          <StatPill label="Total swipes" value={rows.length} />
        </div>
      </div>

      <div className="border-t border-hairline px-5 py-4">
        <h3 className="text-[15px] font-semibold tracking-tight">
          Swipe activity
        </h3>
        <p className="mt-1 text-[13px] text-muted">
          Newest first. Detail shows when the listing is still in the database.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 pb-10 text-center text-sm text-muted">
          {profile
            ? "No swipes yet. Open Browse to start."
            : "Complete preferences, then browse listings to swipe."}
        </p>
      ) : (
        <div className="overflow-x-auto px-0 pb-6">
          <table className="min-w-full divide-y divide-hairline text-sm">
            <thead className="bg-background/60 text-left text-[11px] uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Rent</th>
                <th className="px-4 py-3">Layout</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((r) => {
                const Li = r.listings;
                const thumb = Li?.photo_urls?.[0] ?? Li?.video_url ?? null;
                return (
                  <tr
                    key={`${r.listing_id}-${r.created_at}`}
                    className="align-middle"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.direction === "right"
                            ? "rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-hover"
                            : "rounded-full border border-hairline px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted"
                        }
                      >
                        {r.direction === "right" ? "Saved" : "Passed"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded-lg bg-hairline" />
                        )}
                        <span className="max-w-[200px] truncate">
                          {Li?.address ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {Li?.rent != null ? `$${Li.rent.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {Li
                        ? `${Li.bedrooms ?? "?"}BR · ${Li.bathrooms ?? "?"} bath`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {Li?.status ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {new Date(r.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-hairline px-5 py-4">
        <Link
          href="/listings"
          className="inline-flex w-fit items-center justify-center rounded-full border border-hairline bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Browse listings
        </Link>
      </div>
    </section>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
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
        "rounded-full border px-4 py-2 text-sm " +
        (accent
          ? "border-accent/40 bg-accent-soft text-accent-hover"
          : "border-hairline bg-surface text-foreground")
      }
    >
      <span className="text-muted">{label}</span>{" "}
      <strong className="text-foreground">{value}</strong>
    </div>
  );
}
