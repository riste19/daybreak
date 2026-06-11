import { Inject, Injectable, Logger } from "@nestjs/common";

import type { GenerationInput, GenerationResult, Theme } from "./domain/types";
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
    if (!moderation.ok) {
      this.logger.warn("input blocked by moderation; returning fallback");
      return this.fallback(theme, now);
    }

    const prompt = buildPrompt(moderation.input, theme, now, input.systemPromptOverride);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const raw = await this.llm.generateEmailJson(prompt);
        const validated = validateOutput(raw);
        if (validated.ok) {
          return {
            subject: validated.subject,
            body: validated.body,
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
    return this.fallback(theme, now);
  }

  private fallback(theme: Theme, now: Date): GenerationResult {
    const message = pickFallback(now);
    return {
      subject: message.subject,
      body: message.body,
      theme,
      usedFallback: true,
    };
  }
}
