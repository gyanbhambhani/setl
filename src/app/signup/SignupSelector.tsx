"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Role = "renter" | "landlord" | null;

export function SignupSelector({ initialRole }: { initialRole: Role }) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        Create an account
      </p>
      <h1 className="mt-2 text-[34px] font-semibold tracking-tight sm:text-[40px]">
        How will you use Setl?
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-[1.6] text-muted">
        Pick one. You&rsquo;ll create an account with email and password, then
        finish a short flow for renters or landlords.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <RoleCard
          title="I&rsquo;m looking for housing"
          body="Save preferences and swipe verified Berkeley listings."
          href="/signup/register?redirect=/for-renters/onboard"
          emphasized={initialRole === "renter"}
        />
        <RoleCard
          title="I have a place to list"
          body="Submit photos and details. We review before you go live."
          href="/signup/register?redirect=/for-landlords/onboard"
          emphasized={initialRole === "landlord"}
        />
      </div>

      <p className="mt-10 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function RoleCard({
  title,
  body,
  href,
  emphasized,
}: {
  title: string;
  body: string;
  href: string;
  emphasized: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <Link
        href={href}
        className={
          "flex h-full flex-col gap-3 rounded-[24px] border bg-surface p-7 " +
          "text-left transition-colors " +
          (emphasized
            ? "border-accent shadow-[0_20px_60px_-40px_rgba(92,122,92,0.45)]"
            : "border-hairline hover:border-foreground/25")
        }
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Email &amp; password
        </span>
        <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
        <p className="flex-1 text-[14px] leading-[1.55] text-muted">{body}</p>
        <span className="text-[14px] font-medium text-accent">Choose →</span>
      </Link>
    </motion.div>
  );
}
