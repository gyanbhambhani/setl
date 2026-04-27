import Link from "next/link";
import { ArrowRight, Building2, Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listConversationsForUser,
  type ConversationListItem,
} from "@/lib/messaging/conversations";
import { getSession } from "@/lib/supabaseServer";
import { readIntent, resolveUserRole } from "@/lib/userRole";
import { LandlordPanel, RenterPanel } from "./DashboardPanels";
import {
  loadLandlordActivity,
  loadRenterProfile,
  loadRenterSwipes,
} from "./loadDashboard";

function buildConversationsByMatchKey(
  conversations: ConversationListItem[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of conversations) {
    out[`${c.listing_id}::${c.renter_user_id}`] = c.id;
  }
  return out;
}

export const metadata = { title: "Dashboard — Setl" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const role = await resolveUserRole(user);

  if (role === "new") {
    return <NewUserDashboard email={user.email ?? ""} intent={readIntent(user)} />;
  }

  const conversations = await listConversationsForUser(user.id);
  const renterConversations = conversations.filter(
    (c) => c.perspective === "renter"
  );
  const landlordConversations = conversations.filter(
    (c) => c.perspective === "landlord"
  );

  if (role === "renter") {
    const profile = await loadRenterProfile(user.id);
    const swipes = profile ? await loadRenterSwipes(profile.id) : [];
    return (
      <Shell email={user.email ?? ""} subtitle="Your search and swipes.">
        <RenterPanel
          profile={profile}
          rows={swipes}
          conversations={renterConversations}
        />
      </Shell>
    );
  }

  if (role === "landlord") {
    const listings = await loadLandlordActivity(user.id);
    return (
      <Shell
        email={user.email ?? ""}
        subtitle="Your submissions and renter interest."
      >
        <LandlordPanel
          listings={listings}
          conversations={landlordConversations}
          conversationsByMatchKey={buildConversationsByMatchKey(
            landlordConversations
          )}
        />
      </Shell>
    );
  }

  // role === "both" — explicit double profile
  const [profile, listings] = await Promise.all([
    loadRenterProfile(user.id),
    loadLandlordActivity(user.id),
  ]);
  const swipes = profile ? await loadRenterSwipes(profile.id) : [];
  return (
    <Shell
      email={user.email ?? ""}
      subtitle="Renter and landlord activity in one place."
      nav={[
        { href: "#renter", label: "Renter" },
        { href: "#landlord", label: "Landlord" },
      ]}
    >
      <div className="flex flex-col gap-12">
        <RenterPanel
          profile={profile}
          rows={swipes}
          conversations={renterConversations}
        />
        <LandlordPanel
          listings={listings}
          conversations={landlordConversations}
          conversationsByMatchKey={buildConversationsByMatchKey(
            landlordConversations
          )}
        />
      </div>
    </Shell>
  );
}

function Shell({
  email,
  subtitle,
  children,
  nav,
}: {
  email: string;
  subtitle: string;
  children: React.ReactNode;
  nav?: { href: string; label: string }[];
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-end
            sm:justify-between"
        >
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-[0.22em]
                text-muted-foreground"
            >
              Your Setl
            </p>
            <h1
              className="mt-3 font-display text-[40px] leading-[1.05]
                tracking-tight sm:text-[48px]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
            >
              Dashboard
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {email ? <span>Signed in as <strong>{email}</strong>. </span> : null}
              {subtitle}
            </p>
          </div>
          {nav?.length ? (
            <nav
              className="flex flex-wrap gap-2 text-[13px] font-medium"
              aria-label="Sections"
            >
              {nav.map((n) => (
                <Button
                  key={n.href}
                  variant="outline"
                  size="sm"
                  render={<a href={n.href} />}
                  nativeButton={false}
                >
                  {n.label}
                </Button>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}

function NewUserDashboard({
  email,
  intent,
}: {
  email: string;
  intent: "renter" | "landlord" | null;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-20">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.22em]
            text-muted-foreground"
        >
          Welcome
        </p>
        <h1
          className="mt-3 font-display text-[40px] leading-[1.05]
            tracking-tight sm:text-[48px]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
        >
          Let&rsquo;s finish setting up.
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Signed in as <strong>{email}</strong>. Pick the path that matches
          how you&rsquo;ll use Setl.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PathCard
            highlighted={intent === "renter"}
            href="/for-renters/onboard"
            eyebrow="Renter"
            title="Set search preferences"
            body="Budget, neighborhoods, dealbreakers — then start swiping."
            cta="Renter setup"
            Icon={Compass}
          />
          <PathCard
            highlighted={intent === "landlord"}
            href="/for-landlords/onboard"
            eyebrow="Landlord"
            title="List a place"
            body="Submit photos, address, and rent for verification."
            cta="List a place"
            Icon={Building2}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

function PathCard({
  highlighted,
  href,
  eyebrow,
  title,
  body,
  cta,
  Icon,
}: {
  highlighted: boolean;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  Icon: typeof Building2;
}) {
  return (
    <Card
      className={
        "ring-1 transition-colors " +
        (highlighted
          ? "ring-brand/40 shadow-[0_25px_70px_-50px_var(--brand)]"
          : "ring-foreground/10")
      }
    >
      <CardContent className="flex flex-col gap-4 py-5">
        <span
          className="inline-flex size-10 items-center justify-center rounded-xl
            bg-brand-soft text-brand-ink"
        >
          <Icon className="size-5" strokeWidth={1.5} />
        </span>
        <div className="space-y-1.5">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.22em]
              text-muted-foreground"
          >
            {eyebrow}
          </p>
          <h2
            className="font-display text-[20px] leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {title}
          </h2>
          <p className="text-[14px] leading-[1.5] text-muted-foreground">
            {body}
          </p>
        </div>
        <Button
          className="w-fit"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {cta}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
