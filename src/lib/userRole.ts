import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { User } from "@supabase/supabase-js";

export type UserRole = "renter" | "landlord" | "both" | "new";

export async function resolveUserRole(user: User): Promise<UserRole> {
  const supabase = getSupabaseAdmin();
  const [renterQ, listingQ] = await Promise.all([
    supabase
      .from("renters")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id),
  ]);

  const hasRenter = (renterQ.count ?? 0) > 0;
  const hasLandlord = (listingQ.count ?? 0) > 0;

  if (hasRenter && hasLandlord) return "both";
  if (hasRenter) return "renter";
  if (hasLandlord) return "landlord";

  const intent = readIntent(user);
  if (intent === "renter" || intent === "landlord") return intent;
  return "new";
}

export function readIntent(user: User | null): "renter" | "landlord" | null {
  const meta = (user?.user_metadata ?? {}) as { role?: unknown };
  if (meta.role === "renter" || meta.role === "landlord") {
    return meta.role;
  }
  return null;
}

export function defaultPathForRole(role: UserRole): string {
  switch (role) {
    case "renter":
      return "/listings";
    case "landlord":
      return "/dashboard";
    case "both":
      return "/dashboard";
    case "new":
      return "/signup";
  }
}
