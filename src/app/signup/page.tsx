import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/supabaseServer";
import { SignupSelector } from "./SignupSelector";

export const metadata = { title: "Sign up — Setl" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSession();
  if (user) {
    redirect("/profile");
  }

  const as = sp.as;
  const initialRole =
    as === "landlord" ? "landlord" : as === "renter" ? "renter" : null;

  return (
    <>
      <Header />
      <main className="grain relative flex-1">
        <SignupSelector initialRole={initialRole} />
      </main>
      <Footer />
    </>
  );
}
