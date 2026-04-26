/** Base URL for links in emails and cron (no trailing slash). */
export function getPublicSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const base = raw.replace(/\/$/, "");
  return base || "http://localhost:3000";
}
