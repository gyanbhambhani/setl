import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";

export const metadata = { title: "Profile — Setl" };
export const dynamic = "force-dynamic";

type RenterProfile = {
  id: string;
  budget_min: number | null;
  budget_max: number | null;
  move_date: string | null;
  roommates: number | null;
  neighborhoods: string[] | null;
  dealbreakers: string[] | null;
  description: string | null;
  created_at: string;
};

type ListingProfile = {
  id: string;
  address: string | null;
  rent: number | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
};

async function loadProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: renterRaw } = await supabase
    .from("renters")
    .select(
      "id, budget_min, budget_max, move_date, roommates, neighborhoods, " +
        "dealbreakers, description, created_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  const renter = (renterRaw as unknown as RenterProfile | null) ?? null;

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("id, address, rent, status, bedrooms, bathrooms, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const listings = (listingsRaw as unknown as ListingProfile[]) ?? [];

  let swipeSummary = { right: 0, left: 0 };
  if (renter?.id) {
    const { data: matchesRaw } = await supabase
      .from("matches")
      .select("direction")
      .eq("renter_id", renter.id);
    const matches =
      (matchesRaw as unknown as Array<{ direction: "left" | "right" }>) ?? [];
    const right = (matches ?? []).filter((m) => m.direction === "right").length;
    swipeSummary = { right, left: (matches ?? []).length - right };
  }

  return {
    renter,
    listings,
    swipeSummary,
  };
}

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const { renter, listings, swipeSummary } = await loadProfile(user.id);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Account
        </p>
        <h1 className="mt-2 text-[34px] font-semibold tracking-tight">Profile</h1>
        <p className="mt-3 text-[15px] text-muted">
          Signed in as <strong>{user.email}</strong>
        </p>

        <section className="mt-10 rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-[19px] font-semibold tracking-tight">Renter profile</h2>
          {renter ? (
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Item
                label="Budget"
                value={
                  renter.budget_min != null && renter.budget_max != null
                    ? `$${renter.budget_min}–$${renter.budget_max}`
                    : "—"
                }
              />
              <Item label="Move date" value={renter.move_date ?? "—"} />
              <Item label="Roommates" value={String(renter.roommates ?? "—")} />
              <Item label="Neighborhoods" value={(renter.neighborhoods ?? []).join(", ") || "—"} />
              <Item label="Dealbreakers" value={(renter.dealbreakers ?? []).join(", ") || "—"} />
              <Item label="Ideal place" value={renter.description ?? "—"} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              You have not completed renter onboarding yet.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-hairline bg-surface p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[19px] font-semibold tracking-tight">
              Swipe activity
            </h2>
            <Link
              href="/dashboard"
              className="text-[13px] font-medium text-accent underline-offset-4 hover:underline"
            >
              View full history →
            </Link>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <Badge label="Saved" value={swipeSummary.right} />
            <Badge label="Passed" value={swipeSummary.left} />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-[19px] font-semibold tracking-tight">
            Landlord submissions ({listings.length})
          </h2>
          {listings.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              You have not submitted any listings yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-hairline text-sm">
                <thead className="text-left text-[11px] uppercase tracking-widest text-muted">
                  <tr>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 pr-4">Rent</th>
                    <th className="py-2 pr-4">Layout</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {listings.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 pr-4">{l.address ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {l.rent != null ? `$${l.rent}` : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {l.bedrooms ?? "?"}BR · {l.bathrooms ?? "?"} bath
                      </td>
                      <td className="py-2 pr-4 capitalize">{l.status}</td>
                      <td className="py-2">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-hairline px-3 py-1.5">
      <span className="text-muted">{label}</span>{" "}
      <strong className="text-foreground">{value}</strong>
    </div>
  );
}
