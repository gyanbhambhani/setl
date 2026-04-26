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

export function landlordMatchInterestEmail(args: {
  address: string;
  budgetLabel: string;
  moveDate: string;
  neighborhoods: string;
  loginUrl: string;
}) {
  const { address, budgetLabel, moveDate, neighborhoods, loginUrl } = args;
  return {
    subject: "Someone saved your listing — Setl",
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        Someone is interested in your unit
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 12px;">
        A verified renter saved <strong>${escapeHtml(address)}</strong> on Setl.
        Here&rsquo;s what they shared:
      </p>
      <ul style="font-size:15px;line-height:1.6;margin:0 0 16px;padding-left:20px;">
        <li><strong>Budget:</strong> ${escapeHtml(budgetLabel)}</li>
        <li><strong>Move date:</strong> ${escapeHtml(moveDate)}</li>
        <li><strong>Neighborhoods:</strong> ${escapeHtml(neighborhoods)}</li>
      </ul>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 16px;">
        Reply to this email to connect, or
        <a href="${loginUrl}" style="color:#5c7a5c;">log in to your dashboard</a>
        to see more context.
      </p>
    `),
  };
}

export function renterMatchQueuedEmail() {
  return {
    subject: "We pinged the landlord — Setl",
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        We&rsquo;ve notified the landlord
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0;">
        If they don&rsquo;t respond within 24 hours, we&rsquo;ll follow up for you.
      </p>
    `),
  };
}

export function landlordMatchNudgeEmail(args: {
  address: string;
  renterCount: number;
  loginUrl: string;
}) {
  const { address, renterCount, loginUrl } = args;
  const noun =
    renterCount === 1 ? "a renter is" : `${renterCount} renters are`;
  return {
    subject: "Reminder: renters are waiting — Setl",
    html: wrapper(`
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">
        24-hour check-in
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 12px;">
        ${noun} still waiting on <strong>${escapeHtml(address)}</strong>.
        Please log in to respond &mdash; responsive landlords stay prioritized
        on Setl.
      </p>
      <p style="margin:0;">
        <a href="${loginUrl}" style="display:inline-block;background:#5c7a5c;
        color:#fafaf8;text-decoration:none;padding:12px 20px;border-radius:999px;
        font-size:14px;font-weight:600;">Open dashboard</a>
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
