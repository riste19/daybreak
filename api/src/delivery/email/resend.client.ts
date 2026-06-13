import { Injectable, Logger } from "@nestjs/common";

import { AppConfigService } from "../../config/app-config.service";
import type { EmailClient, OutgoingEmail, SendReceipt } from "./email-client";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * EmailClient backed by Resend (https://resend.com) — chosen for testing/launch
 * because its free tier (100 emails/day) needs no credit card and ships a
 * sandbox sender, `onboarding@resend.dev`, that works without verifying a
 * domain (it can only deliver to the address that owns the API key — exactly
 * what dev testing needs).
 *
 * Uses the plain REST API via global fetch rather than the `resend` SDK to keep
 * the dependency surface at zero; the API is a single POST.
 */
@Injectable()
export class ResendClient implements EmailClient {
  readonly provider = "resend";
  private readonly logger = new Logger(ResendClient.name);

  constructor(private readonly config: AppConfigService) {}

  async send(email: OutgoingEmail): Promise<SendReceipt> {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.emailFrom,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(this.config.emailReplyTo ? { reply_to: this.config.emailReplyTo } : {}),
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
    this.logger.log(`sent ${data.id} to ${email.to}`);
    return { id: data.id };
  }
}
