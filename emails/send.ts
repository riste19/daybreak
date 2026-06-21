import type { ReactElement } from "react";
import { Resend } from "resend";

import { UNSUBSCRIBE_MAILTO, from } from "./config";

/**
 * sendDaybreakEmail — the one place that turns a rendered template into a sent
 * message via Resend. It wires up the deliverability-critical bits so callers
 * don't have to remember them:
 *
 *   • `from` in display-name format ("Daybreak <hello@…>").
 *   • `react` — the template element is rendered to HTML/text by Resend.
 *   • List-Unsubscribe (RFC 2369) with BOTH a mailto and an https URL, so every
 *     mailbox provider can offer a native unsubscribe control.
 *   • List-Unsubscribe-Post: List=Unsubscribe-One-Click (RFC 8058) so Gmail /
 *     Apple Mail show one-tap unsubscribe.
 *
 * ⚠️ One-click unsubscribe is only real if the https endpoint HONOURS A POST and
 * unsubscribes the recipient WITHOUT further interaction (no login, no confirm
 * page). Today app/unsubscribe is a GET page — add a POST route handler that
 * reads the token and cancels the subscription for one-click to actually work.
 */

export interface SendDaybreakEmailArgs {
  to: string;
  subject: string;
  /** The template element, e.g. <DailyPaidEmail {...props} />. */
  react: ReactElement;
  /**
   * The recipient's https unsubscribe URL (token-carrying). Used for the visible
   * footer link AND the List-Unsubscribe header — keep them identical.
   */
  unsubscribeUrl: string;
  /** Override the mailto half of List-Unsubscribe (defaults to the brand mailbox). */
  unsubscribeMailto?: string;
  /** Where replies go. */
  replyTo?: string;
  /** Extra headers, merged last. */
  headers?: Record<string, string>;
}

export async function sendDaybreakEmail({
  to,
  subject,
  react,
  unsubscribeUrl,
  unsubscribeMailto = UNSUBSCRIBE_MAILTO,
  replyTo,
  headers,
}: SendDaybreakEmailArgs) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return resend.emails.send({
    from,
    to,
    subject,
    react,
    ...(replyTo ? { replyTo } : {}),
    headers: {
      // Mailto first, then https — both forms, angle-bracketed per RFC 2369.
      "List-Unsubscribe": `<${unsubscribeMailto}>, <${unsubscribeUrl}>`,
      // RFC 8058: opts the https URL into one-click. Requires the endpoint to
      // accept POST and unsubscribe without further interaction (see header note).
      "List-Unsubscribe-Post": "List=Unsubscribe-One-Click",
      ...headers,
    },
  });
}
