import { Inject, Injectable, Logger } from "@nestjs/common";

import type { GenerationInput, GenerationResult, Theme } from "./domain/types";
import { DEFAULT_SLOT_ID } from "./domain/types";
import { selectTheme } from "./theme/select-theme";
import { moderateInput } from "./moderation/moderate-input";
import { buildPrompt } from "./prompt/build-prompt";
import { validateOutput } from "./validation/validate-output";
import { pickFallback } from "./fallback/fallback-bank";
import { LLM_CLIENT, type LlmClient } from "./gemini/llm-client";

/**
 * Generation attempts before giving up and using the fallback bank. The fallback
 * is a last resort — a daily email is not latency-sensitive, so we'd rather spend
 * several more attempts than send a generic message.
 */
export const MAX_ATTEMPTS = 10;

/**
 * Orchestrates one daily-email generation:
 *   selectTheme → moderateInput → buildPrompt → (LLM → validateOutput) × retries
 *   → fallback on repeated failure or a moderation block.
 *
 * `now` is injectable so theme/fallback selection is deterministic in tests.
 */
@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(@Inject(LLM_CLIENT) private readonly llm: LlmClient) {}

  async generate(
    input: GenerationInput,
    now: Date = new Date(),
  ): Promise<GenerationResult> {
    const theme = selectTheme(now, input.recentThemes, input.preferredThemes);

    const moderation = moderateInput(input);
    if (moderation.flags.length > 0) {
      this.logger.warn(
        `moderation flags — ${moderation.flags
          .map((f) => `${f.field}:${f.reason}`)
          .join(", ")}`,
      );
    }
    const slots = moderation.ok
      ? moderation.input.outputPlan?.slots ?? [DEFAULT_SLOT_ID]
      : input.outputPlan?.slots ?? [DEFAULT_SLOT_ID];

    if (!moderation.ok) {
      this.logger.warn("input blocked by moderation; returning fallback");
      return this.fallback(theme, now, slots);
    }

    const prompt = buildPrompt(moderation.input, theme, now, input.systemPromptOverride);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const raw = await this.llm.generateEmailJson(prompt);
        const validated = validateOutput(raw, slots);
        if (validated.ok) {
          return {
            subject: validated.subject,
            body: joinSections(validated.sections, slots),
            sections: validated.sections,
            theme,
            usedFallback: false,
          };
        }
        this.logger.warn(`attempt ${attempt} failed validation: ${validated.reason}`);
      } catch (err) {
        this.logger.warn(
          `attempt ${attempt} threw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.warn(`all ${MAX_ATTEMPTS} attempts failed; returning fallback`);
    return this.fallback(theme, now, slots);
  }

  /**
   * The fallback bank is a single message; place it in the first AI slot so it
   * renders wherever the user put that slot. Other slots stay empty (skipped).
   */
  private fallback(theme: Theme, now: Date, slots: string[]): GenerationResult {
    const message = pickFallback(now);
    const sections = { [slots[0]]: message.body };
    return {
      subject: message.subject,
      body: message.body,
      sections,
      theme,
      usedFallback: true,
    };
  }
}

/** Join filled slots in plan order, blank-line separated — the convenience body. */
function joinSections(sections: Record<string, string>, slots: string[]): string {
  return slots
    .map((slot) => sections[slot]?.trim() ?? "")
    .filter((text) => text.length > 0)
    .join("\n\n");
}
