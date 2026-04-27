import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
import { resolveUserRole } from "@/lib/userRole";
import { LandlordForm } from "../LandlordForm";

export const metadata = {
  title: "List your unit — Setl",
  description: "Submit a verified Berkeley listing on Setl.",
};

export const dynamic = "force-dynamic";

export default async function LandlordOnboardPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/for-landlords/onboard");
  }

  const role = await resolveUserRole(user);
  if (role === "renter") {
    redirect("/dashboard");
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em]
              text-muted-foreground"
          >
            For landlords
          </p>
          <h1
            className="mt-3 font-display text-[40px] leading-[1.05]
              tracking-tight sm:text-[52px]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
          >
            List a place{" "}
            <span className="italic text-brand">renters can trust.</span>
          </h1>
          <p
            className="mt-4 max-w-xl text-[16px] leading-[1.6]
              text-muted-foreground"
          >
            Signed in as <strong>{user.email}</strong>. We hand-review every
            listing — upload clear photos of the unit before going live.
          </p>
        </div>
        <LandlordForm defaultEmail={user.email ?? ""} />
      </main>
      <Footer />
    </>
  );
}
