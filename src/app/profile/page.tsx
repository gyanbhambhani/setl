import Link from "next/link";
import { ArrowRight, Building2, Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { readIntent, resolveUserRole } from "@/lib/userRole";

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

async function loadRenter(userId: string): Promise<RenterProfile | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("renters")
    .select(
      "id, budget_min, budget_max, move_date, roommates, neighborhoods, " +
        "dealbreakers, description, created_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data as unknown as RenterProfile | null) ?? null;
}

async function loadListings(userId: string): Promise<ListingProfile[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("listings")
    .select("id, address, rent, status, bedrooms, bathrooms, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as unknown as ListingProfile[]) ?? [];
}

async function loadSwipeSummary(
  renterId: string
): Promise<{ right: number; left: number }> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("matches")
    .select("direction")
    .eq("renter_id", renterId);
  const arr =
    (data as unknown as Array<{ direction: "left" | "right" }>) ?? [];
  const right = arr.filter((m) => m.direction === "right").length;
  return { right, left: arr.length - right };
}

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const role = await resolveUserRole(user);

  if (role === "new") {
    return (
      <Shell email={user.email ?? "—"}>
        <EmptyRoleProfile intent={readIntent(user)} />
      </Shell>
    );
  }

  if (role === "renter") {
    const renter = await loadRenter(user.id);
    const swipes = renter
      ? await loadSwipeSummary(renter.id)
      : { right: 0, left: 0 };
    return (
      <Shell email={user.email ?? "—"} eyebrow="Renter">
        <RenterProfileSections profile={renter} swipes={swipes} />
      </Shell>
    );
  }

  if (role === "landlord") {
    const listings = await loadListings(user.id);
    return (
      <Shell email={user.email ?? "—"} eyebrow="Landlord">
        <LandlordProfileSections listings={listings} />
      </Shell>
    );
  }

  // both
  const [renter, listings] = await Promise.all([
    loadRenter(user.id),
    loadListings(user.id),
  ]);
  const swipes = renter
    ? await loadSwipeSummary(renter.id)
    : { right: 0, left: 0 };
  return (
    <Shell email={user.email ?? "—"} eyebrow="Renter & landlord">
      <div className="flex flex-col gap-10">
        <RenterProfileSections profile={renter} swipes={swipes} />
        <LandlordProfileSections listings={listings} />
      </div>
    </Shell>
  );
}

function Shell({
  email,
  eyebrow,
  children,
}: {
  email: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.22em]
            text-muted-foreground"
        >
          {eyebrow ?? "Account"}
        </p>
        <h1
          className="mt-3 font-display text-[40px] leading-[1.05]
            tracking-tight sm:text-[48px]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
        >
          Profile
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Signed in as <strong>{email}</strong>
        </p>
        <div className="mt-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}

function RenterProfileSections({
  profile,
  swipes,
}: {
  profile: RenterProfile | null;
  swipes: { right: number; left: number };
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Renter preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Item
                label="Budget"
                value={
                  profile.budget_min != null && profile.budget_max != null
                    ? `$${profile.budget_min}–$${profile.budget_max}`
                    : "—"
                }
              />
              <Item label="Move date" value={profile.move_date ?? "—"} />
              <Item
                label="Roommates"
                value={String(profile.roommates ?? "—")}
              />
              <Item
                label="Neighborhoods"
                value={(profile.neighborhoods ?? []).join(", ") || "—"}
              />
              <Item
                label="Dealbreakers"
                value={(profile.dealbreakers ?? []).join(", ") || "—"}
              />
              <Item label="Ideal place" value={profile.description ?? "—"} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
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
          <CardTitle>Swipe activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge
              variant="outline"
              className="bg-brand-soft text-brand-ink"
            >
              Saved · {swipes.right}
            </Badge>
            <Badge variant="outline">Passed · {swipes.left}</Badge>
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              View full history
            </Button>
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
  );
}

function LandlordProfileSections({
  listings,
}: {
  listings: ListingProfile[];
}) {
  return (
    <Card className="p-0">
      <CardHeader className="border-b px-5 pb-4 pt-4">
        <CardTitle>Landlord submissions ({listings.length})</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {listings.length === 0 ? (
          <p
            className="px-5 py-8 text-center text-sm text-muted-foreground"
          >
            You haven&rsquo;t submitted any listings yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Address</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-5">{l.address ?? "—"}</TableCell>
                    <TableCell>
                      {l.rent != null ? `$${l.rent}` : "—"}
                    </TableCell>
                    <TableCell>
                      {l.bedrooms ?? "?"}BR · {l.bathrooms ?? "?"} bath
                    </TableCell>
                    <TableCell className="capitalize">{l.status}</TableCell>
                    <TableCell className="pr-5">
                      {new Date(l.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="px-5 py-4">
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/for-landlords/onboard" />}
            nativeButton={false}
          >
            Submit a listing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
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

function EmptyRoleProfile({
  intent,
}: {
  intent: "renter" | "landlord" | null;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 py-6">
        <span
          className="inline-flex size-10 items-center justify-center rounded-xl
            bg-brand-soft text-brand-ink"
        >
          {intent === "landlord" ? (
            <Building2 className="size-5" strokeWidth={1.5} />
          ) : (
            <Compass className="size-5" strokeWidth={1.5} />
          )}
        </span>
        <div>
          <h2
            className="font-display text-[22px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            Finish setting up your profile
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {intent === "landlord"
              ? "Submit your first listing to populate your landlord profile."
              : intent === "renter"
                ? "Set your search preferences to populate your renter profile."
                : "Pick the path that fits how you'll use Setl."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {intent === "landlord" ? (
            <Button
              render={<Link href="/for-landlords/onboard" />}
              nativeButton={false}
            >
              List a place
              <ArrowRight />
            </Button>
          ) : intent === "renter" ? (
            <Button
              render={<Link href="/for-renters/onboard" />}
              nativeButton={false}
            >
              Renter setup
              <ArrowRight />
            </Button>
          ) : (
            <>
              <Button
                render={<Link href="/for-renters/onboard" />}
                nativeButton={false}
              >
                Renter setup
              </Button>
              <Button
                variant="outline"
                render={<Link href="/for-landlords/onboard" />}
                nativeButton={false}
              >
                List a place
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
