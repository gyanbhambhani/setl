import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
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

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            For landlords
          </p>
          <h1
            className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-tight
              sm:text-[44px]"
          >
            List a place{" "}
            <span className="italic text-accent">renters can trust.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-[1.6] text-muted">
            Signed in as <strong>{user.email}</strong>. We hand-review every
            listing. Upload clear photos of the unit before going live.
          </p>
        </div>
        <LandlordForm defaultEmail={user.email ?? ""} />
      </main>
      <Footer />
    </>
  );
}
