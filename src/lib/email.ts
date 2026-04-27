import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.RESEND_FROM ?? "Setl <hello@setl.house>";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send to", args.to);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

const wrapper = (body: string) => `
<div style="font-family:Inter,Arial,sans-serif;background:#fafaf8;padding:32px;
color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;
  border:1px solid #e6e4dc;border-radius:18px;padding:32px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
      <div style="width:24px;height:24px;border-radius:6px;background:#5c7a5c;
      "></div>
      <strong style="font-size:14px;letter-spacing:0.02em;">Setl</strong>
    </div>
    ${body}
    <p style="margin-top:32px;color:#6b6b66;font-size:12px;">
      Setl — Verified student housing in Berkeley.
    </p>
  </div>
</div>`;

export function renterConfirmationEmail() {
  return {
    subject: "You're on the list — Setl",
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        You're on the list.
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 12px;">
        Welcome to Setl. We hand-review every landlord and every video
        walkthrough before listings go live, so what you see is what you get.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0;">
        We'll email you the moment a verified place fits your preferences.
      </p>
    `),
  };
}

export type LandlordDigestSave = {
  address: string;
  budgetLabel: string;
  moveDate: string;
  neighborhoods: string;
  savedAt: string;
};

export type LandlordDigestListingSummary = {
  address: string;
  saves: number;
  awaitingResponse: number;
};

export function landlordDailyDigestEmail(args: {
  newSaves: LandlordDigestSave[];
  awaitingResponse: number;
  listings: LandlordDigestListingSummary[];
  loginUrl: string;
}) {
  const { newSaves, awaitingResponse, listings, loginUrl } = args;
  const newCount = newSaves.length;

  const headline =
    newCount > 0
      ? newCount === 1
        ? "1 new renter saved your place"
        : `${newCount} new renters saved your places`
      : awaitingResponse > 0
        ? "Renters are still waiting for a reply"
        : "Today's Setl recap";

  const savesBlock =
    newCount === 0
      ? `<p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 16px;">
           No new saves in the last 24 hours. We&rsquo;ll keep watching.
         </p>`
      : `<ul style="font-size:14px;line-height:1.55;margin:0 0 18px;
            padding-left:20px;color:#1a1a1a;">
          ${newSaves
            .map(
              (s) =>
                `<li style="margin-bottom:8px;">
                  <strong>${escapeHtml(s.address)}</strong>
                  &mdash; ${escapeHtml(s.budgetLabel)},
                  move ${escapeHtml(s.moveDate)},
                  ${escapeHtml(s.neighborhoods)}
                </li>`
            )
            .join("")}
        </ul>`;

  const listingsBlock =
    listings.length === 0
      ? ""
      : `<p style="font-size:13px;line-height:1.55;color:#6b6b66;
           margin:0 0 6px;">Your listings</p>
         <ul style="font-size:14px;line-height:1.55;margin:0 0 18px;
           padding-left:20px;color:#1a1a1a;">
          ${listings
            .map(
              (l) =>
                `<li style="margin-bottom:6px;">
                  <strong>${escapeHtml(l.address)}</strong>
                  &mdash; ${l.saves} ${l.saves === 1 ? "save" : "saves"} total
                  ${
                    l.awaitingResponse > 0
                      ? `, <span style="color:#b35900;">${l.awaitingResponse} awaiting reply</span>`
                      : ""
                  }
                </li>`
            )
            .join("")}
        </ul>`;

  return {
    subject: `Setl daily — ${headline.toLowerCase()}`,
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        ${escapeHtml(headline)}
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 16px;">
        Here&rsquo;s a one-a-day recap of activity on your places.
      </p>
      ${savesBlock}
      ${listingsBlock}
      <p style="margin:0 0 16px;">
        <a href="${loginUrl}" style="display:inline-block;background:#5c7a5c;
        color:#fafaf8;text-decoration:none;padding:12px 20px;
        border-radius:999px;font-size:14px;font-weight:600;">
          Respond to renters in the app
        </a>
      </p>
      <p style="font-size:13px;line-height:1.55;color:#6b6b66;margin:0;">
        Replies happen inside Setl so renters keep their contact info private.
        End-to-end encrypted in-app messaging is on the way.
      </p>
    `),
  };
}

export type RenterDigestActivity = {
  savedAddresses: string[];
  passedCount: number;
  awaitingLandlord: number;
};

export function renterDailyDigestEmail(args: {
  activity: RenterDigestActivity;
  loginUrl: string;
}) {
  const { activity, loginUrl } = args;
  const { savedAddresses, passedCount, awaitingLandlord } = activity;
  const savedCount = savedAddresses.length;

  const headline =
    savedCount > 0
      ? savedCount === 1
        ? "You saved 1 place today"
        : `You saved ${savedCount} places today`
      : passedCount > 0
        ? "Today's Setl recap"
        : "Quiet day on Setl";

  const savedBlock =
    savedCount === 0
      ? ""
      : `<p style="font-size:13px;line-height:1.55;color:#6b6b66;
           margin:0 0 6px;">Saved</p>
         <ul style="font-size:14px;line-height:1.55;margin:0 0 18px;
           padding-left:20px;color:#1a1a1a;">
          ${savedAddresses
            .map((a) => `<li>${escapeHtml(a)}</li>`)
            .join("")}
        </ul>`;

  const awaitingLine =
    awaitingLandlord > 0
      ? `<p style="font-size:14px;line-height:1.55;color:#1a1a1a;
           margin:0 0 16px;">
           ${awaitingLandlord} ${
             awaitingLandlord === 1 ? "place is" : "places are"
           } waiting on a landlord reply. We&rsquo;ll nudge them again
           tomorrow.
         </p>`
      : "";

  return {
    subject: `Setl daily — ${headline.toLowerCase()}`,
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        ${escapeHtml(headline)}
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 16px;">
        One quick recap a day &mdash; no pings every time you tap save.
      </p>
      ${savedBlock}
      ${awaitingLine}
      <p style="font-size:14px;line-height:1.55;color:#6b6b66;margin:0 0 16px;">
        ${passedCount > 0 ? `Passed on ${passedCount}.` : ""}
      </p>
      <p style="margin:0 0 16px;">
        <a href="${loginUrl}" style="display:inline-block;background:#5c7a5c;
        color:#fafaf8;text-decoration:none;padding:12px 20px;
        border-radius:999px;font-size:14px;font-weight:600;">
          Open Setl
        </a>
      </p>
      <p style="font-size:13px;line-height:1.55;color:#6b6b66;margin:0;">
        Landlord replies will land in your dashboard. End-to-end encrypted
        in-app messaging is coming soon.
      </p>
    `),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function landlordConfirmationEmail() {
  return {
    subject: "We received your listing — Setl",
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        Thanks — your listing is in review.
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 12px;">
        A real person will review your 60-second walkthrough within a day.
        Once approved, your place is live for verified Berkeley renters.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0;">
        Reminder: you've agreed to respond to interested renters within
        24 hours so listings stay prioritized.
      </p>
    `),
  };
}
