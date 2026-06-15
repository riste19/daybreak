/**
 * Minimal transactional-email transport for the Next app (contact replies, etc).
 *
 * Backed by Resend's REST API via global fetch — same provider and env-var names
 * the generation engine uses (see api/src/delivery/email/resend.client.ts), kept
 * as a separate copy because the api/ package is standalone and we don't import
 * across the package line. Zero dependencies: the API is a single POST.
 *
 * When RESEND_API_KEY / EMAIL_FROM aren't set (e.g. local dev), callers should
 * branch on isEmailConfigured() and take a demo path rather than calling send()
 * — mirroring how the auth/subscribe actions degrade gracefully without keys.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface TransactionalEmail {
  to: string;
  subject: string;
  /** Rendered HTML body. */
  html: string;
  /** Plain-text alternative — required for deliverability, never optional. */
  text: string;
  /** Where replies should go (e.g. the contact form submitter). */
  replyTo?: string;
}

/** True when the Resend transport has the env it needs to actually send. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Send one email. Throws on misconfiguration or transport/API errors. */
export async function sendEmail(email: TransactionalEmail): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "Email transport is not configured (set RESEND_API_KEY and EMAIL_FROM).",
    );
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Resend send failed (${response.status} ${response.statusText}): ${detail}`,
    );
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Resend send succeeded but returned no message id");
  }
  return { id: data.id };
}

/** Escape a string for safe interpolation into an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
