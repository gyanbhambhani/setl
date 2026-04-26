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
