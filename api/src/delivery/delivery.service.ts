import { Inject, Injectable, Logger } from "@nestjs/common";

import { GenerationService } from "../generation/generation.service";
import { hasDistress } from "../generation/moderation/moderate-input";
import type { SendDailyInput, SendDailyResult } from "./domain/types";
import { renderDailyEmail } from "./template/render-email";
import { EMAIL_CLIENT, type EmailClient } from "./email/email-client";

/**
 * One daily-email delivery: generate → render template → send.
 *
 * The boundary that matters: `personalNote` (the premium static-text feature)
 * is split off BEFORE generation and only rejoins at the template. The
 * subscriber's own words are never part of the LLM prompt — that is the
 * product promise, enforced here rather than by convention.
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly generation: GenerationService,
    @Inject(EMAIL_CLIENT) private readonly email: EmailClient,
  ) {}

  async sendDaily(
    input: SendDailyInput,
    now: Date = new Date(),
  ): Promise<SendDailyResult> {
    const { to, personalNote, message, ...generationInput } = input;

    // A prepared message (one the user already previewed and approved) is sent
    // verbatim; otherwise generate fresh.
    const result = message
      ? { ...message, usedFallback: false }
      : await this.generation.generate(generationInput, now);

    // The note skips the LLM, so it also skips generation's moderation pass.
    // Apply the same distress posture here: never echo distress back at 7 a.m.
    let note = personalNote;
    if (note && hasDistress(note)) {
      this.logger.warn("personalNote dropped — distress flag");
      note = undefined;
    }

    const { html, text } = renderDailyEmail({
      subject: result.subject,
      body: result.body,
      tone: input.tone,
      theme: result.theme,
      personalNote: note,
    });

    const receipt = await this.email.send({
      to,
      subject: result.subject,
      html,
      text,
    });

    this.logger.log(
      `delivered via ${this.email.provider} (${receipt.id}) — theme=${result.theme} fallback=${result.usedFallback}`,
    );

    return {
      to,
      subject: result.subject,
      theme: result.theme,
      usedFallback: result.usedFallback,
      provider: this.email.provider,
      messageId: receipt.id,
    };
  }
}
