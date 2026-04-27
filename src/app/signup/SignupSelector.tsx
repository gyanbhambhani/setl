"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Home, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "renter" | "landlord" | null;

export function SignupSelector({ initialRole }: { initialRole: Role }) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-20">
      <p
        className="font-mono text-[11px] uppercase tracking-[0.22em]
          text-muted-foreground"
      >
        Create an account
      </p>
      <h1
        className="mt-3 font-display text-[40px] leading-[1.02] tracking-tight
          sm:text-[52px]"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
      >
        How will you use{" "}
        <span className="text-brand">Setl</span>?
      </h1>
      <p
        className="mt-4 max-w-lg text-[16px] leading-[1.6] text-muted-foreground"
      >
        Pick one path. You will create an account with email and password, then
        finish a short setup tailored to your role.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <RoleCard
          icon={KeyRound}
          eyebrow="Renter"
          title="I'm looking for housing"
          body="Save preferences and swipe verified Berkeley listings."
          href="/signup/register?role=renter&redirect=/for-renters/onboard"
          emphasized={initialRole === "renter"}
        />
        <RoleCard
          icon={Home}
          eyebrow="Landlord"
          title="I have a place to list"
          body="Submit photos and details. We review before you go live."
          href="/signup/register?role=landlord&redirect=/for-landlords/onboard"
          emphasized={initialRole === "landlord"}
        />
      </div>

      <p className="mt-12 text-center text-[14px] text-muted-foreground">
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

type Icon = typeof KeyRound;

function RoleCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  href,
  emphasized,
}: {
  icon: Icon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  emphasized: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="h-full"
    >
      <Link
        href={href}
        className={cn(
          "group relative flex h-full flex-col gap-4 rounded-2xl border bg-card",
          "p-6 text-left transition-colors",
          emphasized
            ? "border-brand shadow-[0_25px_70px_-45px_var(--brand)]"
            : "border-border hover:border-foreground/30"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className="inline-flex size-10 items-center justify-center rounded-xl
              bg-brand-soft text-brand-ink"
          >
            <Icon className="size-5" strokeWidth={1.5} />
          </span>
          <ArrowUpRight
            className="size-5 text-muted-foreground transition-transform
              group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.5}
          />
        </div>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.24em]
            text-muted-foreground"
        >
          {eyebrow}
        </span>
        <h2
          className="font-display text-[22px] leading-[1.15] tracking-tight"
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          {title}
        </h2>
        <p className="flex-1 text-[14px] leading-[1.55] text-muted-foreground">
          {body}
        </p>
      </Link>
    </motion.div>
  );
}
