import { Injectable, Logger } from "@nestjs/common";

import type { EmailClient, OutgoingEmail, SendReceipt } from "./email-client";

/**
 * Zero-config EmailClient used when RESEND_API_KEY is not set: logs the email
 * instead of sending it, so the full delivery flow (generate → render → send)
 * is exercisable locally without any account. Same graceful-degradation posture
 * as the Gemini fallback — the server always boots and the endpoint always works.
 */
@Injectable()
export class ConsoleEmailClient implements EmailClient {
  readonly provider = "console";
  private readonly logger = new Logger(ConsoleEmailClient.name);

  async send(email: OutgoingEmail): Promise<SendReceipt> {
    const id = `console-${Date.now().toString(36)}`;
    this.logger.log(
      `RESEND_API_KEY not set — printing email instead of sending.\n` +
        `── to: ${email.to}\n── subject: ${email.subject}\n` +
        `── text ──\n${email.text}\n── end ──`,
    );
    return { id };
  }
}
