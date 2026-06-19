/**
 * The narrow email-transport surface the delivery flow depends on. Keeping this
 * an interface (mirroring LlmClient) means the service is trivially testable
 * with a fake, and the provider can be swapped (Resend → SES/Postmark/…) by
 * changing one binding in DeliveryModule.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  /** Rendered HTML body (from renderDailyEmail). */
  html: string;
  /** Plain-text alternative — required for deliverability, never optional. */
  text: string;
  /**
   * Absolute URL for the `List-Unsubscribe` header (RFC 2369). When set, the
   * client emits the header so mailbox providers (Gmail etc.) surface a native
   * unsubscribe control and treat the message as a well-behaved sender — which
   * helps inbox placement. This is separate from, and additive to, the visible
   * unsubscribe link rendered in the email footer.
   */
  listUnsubscribeUrl?: string;
}

export interface SendReceipt {
  /** Provider-assigned message id (or a synthetic one for the console client). */
  id: string;
}

export interface EmailClient {
  /** Short provider name surfaced in responses/logs ("resend", "console"). */
  readonly provider: string;
  /** Send one email. May throw on transport/API errors — the caller decides retry policy. */
  send(email: OutgoingEmail): Promise<SendReceipt>;
}

/** DI token for the EmailClient implementation (ResendClient in production). */
export const EMAIL_CLIENT = Symbol("EMAIL_CLIENT");
