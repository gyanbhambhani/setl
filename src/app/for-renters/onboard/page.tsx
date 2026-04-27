import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { resolveUserRole } from "@/lib/userRole";
import { RenterForm, type RenterDefaults } from "../RenterForm";

export const metadata = {
  title: "Renter preferences — Setl",
  description: "Tell us what you're looking for in Berkeley.",
};

export const dynamic = "force-dynamic";

async function loadDefaults(userId: string): Promise<RenterDefaults | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("renters")
      .select(
        "budget_min, budget_max, move_date, roommates, neighborhoods," +
          " dealbreakers, description"
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return data as unknown as RenterDefaults;
  } catch {
    return null;
  }
}

export default async function RenterOnboardPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/for-renters/onboard");
  }

  const role = await resolveUserRole(user);
  if (role === "landlord") {
    redirect("/dashboard");
  }

  const defaults = await loadDefaults(user.id);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em]
              text-muted-foreground"
          >
            For renters
          </p>
          <h1
            className="mt-3 font-display text-[40px] leading-[1.05]
              tracking-tight sm:text-[52px]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
          >
            Tell us about your{" "}
            <span className="italic text-brand">ideal place.</span>
          </h1>
          <p
            className="mt-4 max-w-xl text-[16px] leading-[1.6]
              text-muted-foreground"
          >
            Signed in as <strong>{user.email}</strong>. We&rsquo;ll only show
            you verified Berkeley listings that fit.
          </p>
        </div>
        <RenterForm defaults={defaults} />
      </main>
      <Footer />
    </>
  );
}
