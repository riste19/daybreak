import { Inject, Injectable, Logger } from "@nestjs/common";

import { AppConfigService } from "../config/app-config.service";
import { GenerationService } from "../generation/generation.service";
import { hasDistress } from "../generation/moderation/moderate-input";
import type { GenerationResult } from "../generation/domain/types";
import type { SendDailyInput, SendDailyResult, PreparedMessage } from "./domain/types";
import type { EmailLayout } from "./domain/layout";
import { DEFAULT_LAYOUT, toOutputPlan } from "./domain/layout";
import { DEFAULT_BRANDING, renderDailyEmail } from "./template/render-email";
import { EMAIL_CLIENT, type EmailClient } from "./email/email-client";

/**
 * One daily-email delivery: resolve layout → generate → render template → send.
 *
 * The boundary that matters: the layout's **verbatim** text (the subscriber's
 * own words) never enters the LLM prompt — only **feed** text does. The split is
 * enforced here: `toOutputPlan` hands the model just the AI slots + feed, while
 * verbatim text stays in the layout for the template. The legacy `personalNote`
 * is folded into the layout as one verbatim block.
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly generation: GenerationService,
    @Inject(EMAIL_CLIENT) private readonly email: EmailClient,
    private readonly config: AppConfigService,
  ) {}

  async sendDaily(
    input: SendDailyInput,
    now: Date = new Date(),
  ): Promise<SendDailyResult> {
    const { to, personalNote, message, emailLayout, ...generationInput } = input;

    // Resolve the effective layout: the subscriber's, else the canonical one;
    // fold the legacy personalNote in; then drop any verbatim block that trips
    // the distress filter (verbatim text skips the LLM, so it skips generation's
    // moderation — we never echo distress back at 7 a.m.).
    let layout = emailLayout ?? DEFAULT_LAYOUT;
    if (personalNote) layout = foldPersonalNote(layout, personalNote);
    layout = dropDistressVerbatim(layout, (text) =>
      this.logger.warn(`verbatim block dropped — distress flag: "${truncate(text)}"`),
    );

    // The layout is the source of truth for which slots to fill + what feed
    // material to weave in — override whatever the client put in outputPlan.
    const plan = toOutputPlan(layout);
    const result: GenerationResult = message
      ? preparedToResult(message, plan.slots)
      : await this.generation.generate({ ...generationInput, outputPlan: plan }, now);

    const { html, text } = renderDailyEmail(
      {
        subject: result.subject,
        sections: result.sections,
        tone: input.tone,
        theme: result.theme,
        layout,
      },
      { unsubscribeUrl: `${this.config.appUrl}/unsubscribe` },
    );

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

/** Insert the legacy personalNote as one labelled verbatim block, before the
 * first signature/meta/footer chrome (else at the end). */
function foldPersonalNote(layout: EmailLayout, note: string): EmailLayout {
  const noteSection: EmailLayout["sections"][number] = {
    kind: "text",
    id: "personal-note",
    text: note,
    handling: "verbatim",
    label: DEFAULT_BRANDING.personalNoteLabel,
  };
  const idx = layout.sections.findIndex(
    (s) =>
      s.kind === "chrome" &&
      (s.role === "signature" || s.role === "meta" || s.role === "footer"),
  );
  const sections = [...layout.sections];
  if (idx === -1) sections.push(noteSection);
  else sections.splice(idx, 0, noteSection);
  return { ...layout, sections };
}

/** Remove verbatim text blocks whose content trips the distress filter. */
function dropDistressVerbatim(
  layout: EmailLayout,
  onDrop: (text: string) => void,
): EmailLayout {
  const sections = layout.sections.filter((s) => {
    if (s.kind === "text" && s.handling === "verbatim" && hasDistress(s.text)) {
      onDrop(s.text);
      return false;
    }
    return true;
  });
  return { ...layout, sections };
}

/** Map an approved PreparedMessage into a GenerationResult shape for rendering. */
function preparedToResult(
  message: PreparedMessage,
  slots: string[],
): GenerationResult {
  const sections = message.sections ?? { [slots[0]]: message.body };
  return {
    subject: message.subject,
    body: message.body,
    sections,
    theme: message.theme,
    usedFallback: false,
  };
}

function truncate(value: string, max = 40): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
