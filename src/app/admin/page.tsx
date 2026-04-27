import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminListings, type AdminListing } from "./AdminListings";
import {
  ApprovedListings,
  type ApprovedListing,
} from "./ApprovedListings";

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
  const [pending, approvedRes, matchesRes, renters] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, address, rent, bedrooms, bathrooms, video_url, photo_urls, " +
          "amenities, available_date, landlord_email, landlord_phone, " +
          "status, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(
        "id, address, neighborhood, rent, bedrooms, bathrooms, video_url, " +
          "photo_urls, amenities, available_date, landlord_email, " +
          "landlord_phone, status, created_at"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase.from("matches").select("listing_id, direction"),
    supabase
      .from("renters")
      .select(
        "id, email, budget_min, budget_max, move_date, roommates," +
          " neighborhoods, dealbreakers, description, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const counts = new Map<string, { rights: number; lefts: number }>();
  for (const row of (matchesRes.data ?? []) as Array<{
    listing_id: string;
    direction: string;
  }>) {
    const cur = counts.get(row.listing_id) ?? { rights: 0, lefts: 0 };
    if (row.direction === "right") cur.rights += 1;
    else if (row.direction === "left") cur.lefts += 1;
    counts.set(row.listing_id, cur);
  }
  const approved = ((approvedRes.data ?? []) as unknown as Omit<
    ApprovedListing,
    "rights" | "lefts"
  >[]).map((l) => {
    const c = counts.get(l.id) ?? { rights: 0, lefts: 0 };
    return { ...l, rights: c.rights, lefts: c.lefts };
  });

  return {
    pending: (pending.data ?? []) as unknown as AdminListing[],
    approved,
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
        <main
          className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-16
            sm:py-24"
        >
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em]
              text-muted-foreground"
          >
            Internal
          </p>
          <h1
            className="mt-3 font-display text-[34px] leading-[1.05]
              tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            Admin
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Enter the password to review listings.
          </p>
          <Card className="mt-8">
            <CardContent>
              <form action="/api/admin/login" method="post">
                <FieldGroup>
                  <Field data-invalid={sp?.error ? true : undefined}>
                    <FieldLabel htmlFor="admin-password">Password</FieldLabel>
                    <Input
                      id="admin-password"
                      type="password"
                      name="password"
                      required
                      autoFocus
                      placeholder="••••••••"
                      aria-invalid={sp?.error ? true : undefined}
                    />
                    <FieldError>
                      {sp?.error ? "Wrong password." : undefined}
                    </FieldError>
                  </Field>
                  <Button type="submit" size="lg">
                    Sign in
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const { pending, approved, renters } = await loadAdminData();
  const totalRights = approved.reduce((sum, l) => sum + l.rights, 0);

  return (
    <>
      <Header />
      <main
        className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:py-16"
      >
        <div
          className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end
            sm:justify-between"
        >
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-[0.22em]
                text-muted-foreground"
            >
              Internal
            </p>
            <h1
              className="mt-3 font-display text-[36px] leading-[1.05]
                tracking-tight sm:text-[44px]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
            >
              Review queue
            </h1>
          </div>
          <form action="/api/admin/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>

        <section className="mb-14">
          <h2
            className="mb-5 font-display text-[20px] leading-tight
              tracking-tight"
          >
            Pending listings ({pending.length})
          </h2>
          <AdminListings listings={pending} />
        </section>

        <section className="mb-14">
          <div
            className="mb-5 flex flex-wrap items-baseline justify-between
              gap-3"
          >
            <h2
              className="font-display text-[20px] leading-tight tracking-tight"
            >
              Approved listings ({approved.length})
            </h2>
            <p className="text-[12px] text-muted-foreground">
              {totalRights} renter{" "}
              {totalRights === 1 ? "right-swipe" : "right-swipes"} so far
            </p>
          </div>
          <ApprovedListings listings={approved} />
        </section>

        <section>
          <h2
            className="mb-5 font-display text-[20px] leading-tight
              tracking-tight"
          >
            Renter signups ({renters.length})
          </h2>
          <RenterTable rows={renters} />
        </section>

        <p className="mt-12 text-[12px] text-muted-foreground">
          Need to flip an approved or rejected listing back to pending? Edit
          it in the{" "}
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
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No renter signups yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="p-0">
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Email</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Move</TableHead>
                <TableHead>Roommates</TableHead>
                <TableHead>Neighborhoods</TableHead>
                <TableHead>Dealbreakers</TableHead>
                <TableHead>Ideal</TableHead>
                <TableHead className="pr-5">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="pl-5 font-medium">
                    {r.email ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.budget_min != null && r.budget_max != null
                      ? `$${r.budget_min}–$${r.budget_max}`
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.move_date ?? "—"}
                  </TableCell>
                  <TableCell>{r.roommates ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] text-muted-foreground">
                    {(r.neighborhoods ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] text-muted-foreground">
                    {(r.dealbreakers ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="max-w-[260px] text-muted-foreground">
                    {r.description ?? "—"}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap pr-5
                      text-muted-foreground"
                  >
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
