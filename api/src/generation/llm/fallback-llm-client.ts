import { Logger } from "@nestjs/common";

import type { BuiltPrompt } from "../prompt/build-prompt";
import type { LlmClient } from "./llm-client";

/**
 * An LlmClient that fans a single request across an ordered list of providers.
 * It tries each in turn and returns the first success; a provider that throws
 * (transport error, empty response, exhausted quota / 429) is logged and the
 * next provider is tried. Only if every provider throws does this throw — which
 * the GenerationService counts as one failed attempt (ultimately the static
 * fallback bank).
 *
 * "Add another LLM for any case" = push another LlmClient onto the chain.
 */
export class FallbackLlmClient implements LlmClient {
  readonly name = "fallback-chain";
  private readonly logger = new Logger(FallbackLlmClient.name);

  constructor(private readonly providers: LlmClient[]) {
    if (providers.length === 0) {
      throw new Error("FallbackLlmClient requires at least one provider");
    }
  }

  async generateEmailJson(
    prompt: BuiltPrompt,
    opts?: { temperature?: number },
  ): Promise<string> {
    const errors: string[] = [];
    const total = this.providers.length;

    for (let i = 0; i < total; i++) {
      const provider = this.providers[i];
      const label = provider.name ?? "provider";
      this.logger.log(`trying provider "${label}" (${i + 1}/${total})`);
      try {
        const result = await provider.generateEmailJson(prompt, opts);
        this.logger.log(`provider "${label}" succeeded — serving this response`);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${label}: ${message}`);
        this.logger.warn(
          `provider "${label}" failed (${message})` +
            (i + 1 < total ? "; trying next provider" : "; no providers left"),
        );
      }
    }

    throw new Error(`all LLM providers failed — ${errors.join("; ")}`);
  }
}
