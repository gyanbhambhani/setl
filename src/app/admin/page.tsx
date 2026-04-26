import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminListings, type AdminListing } from "./AdminListings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Setl" };

type RenterRow = {
  id: string;
  email: string | null;
  budget_min: number | null;
  budget_max: number | null;
  move_date: string | null;
  roommates: number | null;
  neighborhoods: string[] | null;
  dealbreakers: string[] | null;
  description: string | null;
  created_at: string;
};

async function loadAdminData() {
  const supabase = getSupabaseAdmin();
  const [pending, renters] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, address, rent, bedrooms, bathrooms, video_url, photo_urls, amenities," +
          " available_date, landlord_email, landlord_phone, status," +
          " created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("renters")
      .select(
        "id, email, budget_min, budget_max, move_date, roommates," +
          " neighborhoods, dealbreakers, description, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  return {
    pending: (pending.data ?? []) as unknown as AdminListing[],
    renters: (renters.data ?? []) as unknown as RenterRow[],
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const authed = await isAdmin();
  if (!authed) {
    return (
      <>
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-24">
          <h1 className="text-[28px] font-semibold tracking-tight">
            Admin
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Enter the password to review listings.
          </p>
          <form
            action="/api/admin/login"
            method="post"
            className="mt-8 flex flex-col gap-3"
          >
            <input
              type="password"
              name="password"
              required
              autoFocus
              placeholder="Password"
              className="w-full rounded-xl border border-hairline bg-surface
                px-4 py-3 text-[15px] focus:border-accent focus:outline-none
                focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-accent text-sm font-medium text-[#fafaf8]
                hover:bg-accent-hover"
            >
              Sign in
            </button>
            {sp?.error ? (
              <p className="text-sm text-red-700">Wrong password.</p>
            ) : null}
          </form>
        </main>
        <Footer />
      </>
    );
  }

  const { pending, renters } = await loadAdminData();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Admin
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
              Review queue
            </h1>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="text-sm text-muted underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="mb-16">
          <h2 className="mb-4 text-[18px] font-semibold tracking-tight">
            Pending listings ({pending.length})
          </h2>
          <AdminListings listings={pending} />
        </section>

        <section>
          <h2 className="mb-4 text-[18px] font-semibold tracking-tight">
            Renter signups ({renters.length})
          </h2>
          <RenterTable rows={renters} />
        </section>

        <p className="mt-12 text-[12px] text-muted">
          Need to flip an approved or rejected listing back to pending?
          Edit it in the{" "}
          <Link
            href="https://supabase.com/dashboard"
            className="underline underline-offset-4"
          >
            Supabase dashboard
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}

function RenterTable({ rows }: { rows: RenterRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted">
        No renter signups yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
      <table className="min-w-full divide-y divide-hairline text-sm">
        <thead className="bg-background/60 text-left text-[11px] uppercase tracking-widest text-muted">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Budget</th>
            <th className="px-4 py-3">Move</th>
            <th className="px-4 py-3">Roommates</th>
            <th className="px-4 py-3">Neighborhoods</th>
            <th className="px-4 py-3">Dealbreakers</th>
            <th className="px-4 py-3">Ideal</th>
            <th className="px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="px-4 py-3 font-medium">{r.email ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.budget_min != null && r.budget_max != null
                  ? `$${r.budget_min}–$${r.budget_max}`
                  : "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.move_date ?? "—"}
              </td>
              <td className="px-4 py-3">{r.roommates ?? "—"}</td>
              <td className="px-4 py-3 max-w-[220px] text-muted">
                {(r.neighborhoods ?? []).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 max-w-[220px] text-muted">
                {(r.dealbreakers ?? []).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 max-w-[280px] text-muted">
                {r.description ?? "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
