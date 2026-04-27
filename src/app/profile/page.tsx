import { redirect } from "next/navigation";

// Profile has been merged into the unified dashboard view. Keep this route
// alive as a permanent redirect so old emails / bookmarks still land in the
// right place.
export const dynamic = "force-dynamic";

export default function ProfileRedirect() {
  redirect("/dashboard");
}
