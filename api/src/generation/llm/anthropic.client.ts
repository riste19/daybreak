import { Injectable, Logger } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

import { AppConfigService } from "../../config/app-config.service";
import type { BuiltPrompt } from "../prompt/build-prompt";
import type { LlmClient } from "./llm-client";

/**
 * Anthropic-backed LlmClient — the fallback provider when Gemini errors (e.g. its
 * key runs out of quota / 429). Default model is Claude Haiku 4.5: fast, cheap,
 * and ample for a short templated email.
 *
 * Like the Gemini client, we don't use structured outputs to force the JSON:
 * our `sections` is a dynamic-key map, which Anthropic's json_schema format can't
 * express (it requires additionalProperties:false). The prompt already instructs
 * the model to return the JSON object, and validateOutput parses/validates it.
 *
 * `thinking` and `effort` are intentionally omitted — both error on Haiku 4.5.
 * The SDK retries 429/5xx with backoff automatically (max_retries=2).
 */
@Injectable()
export class AnthropicClient implements LlmClient {
  readonly name = "anthropic";
  private readonly logger = new Logger(AnthropicClient.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(config: AppConfigService) {
    this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    this.model = config.anthropicModel;
  }

  async generateEmailJson(
    prompt: BuiltPrompt,
    opts: { temperature?: number } = {},
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      // Headroom for subject + several slots; validateOutput still caps the body.
      max_tokens: 1200,
      temperature: opts.temperature ?? 0.9,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!text.trim()) {
      throw new Error("Anthropic returned an empty response");
    }
    return text;
  }
}
