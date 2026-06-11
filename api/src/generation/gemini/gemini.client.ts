import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";

import { AppConfigService } from "../../config/app-config.service";
import type { BuiltPrompt } from "../prompt/build-prompt";
import type { LlmClient } from "./llm-client";

/**
 * Gemini-backed LlmClient using the current @google/genai SDK.
 * `systemInstruction` carries our guardrails; `responseMimeType: application/json`
 * nudges the model toward parseable output (we still validate it ourselves).
 */
@Injectable()
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);
  /** One SDK client per configured key, in failover priority order. */
  private readonly clients: GoogleGenAI[];
  private readonly model: string;
  /** Index of the key we're currently using; advances when a key fails. */
  private keyIndex = 0;

  constructor(config: AppConfigService) {
    const keys = config.geminiApiKeys;
    this.clients = keys.map((apiKey) => new GoogleGenAI({ apiKey }));
    this.model = config.geminiModel;
    this.logger.log(`Gemini client ready with ${this.clients.length} key(s)`);
  }

  async generateEmailJson(
    prompt: BuiltPrompt,
    opts: { temperature?: number } = {},
  ): Promise<string> {
    const total = this.clients.length;
    let lastErr: unknown;

    // Try keys starting from the current one, wrapping through the whole list.
    // On a key failure we advance keyIndex so the next request starts from the
    // first key that's still working, instead of re-hitting a dead one.
    for (let i = 0; i < total; i++) {
      const idx = (this.keyIndex + i) % total;
      try {
        const text = await this.callWithClient(this.clients[idx], prompt, opts);
        this.keyIndex = idx; // stick with the key that just worked
        return text;
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `Gemini key #${idx + 1}/${total} failed: ${
            err instanceof Error ? err.message : String(err)
          }${i + 1 < total ? " — trying next key" : ""}`,
        );
      }
    }

    // Every key failed for this call — surface the last error to the retry loop.
    throw lastErr instanceof Error
      ? lastErr
      : new Error(`All ${total} Gemini key(s) failed`);
  }

  private async callWithClient(
    ai: GoogleGenAI,
    prompt: BuiltPrompt,
    opts: { temperature?: number },
  ): Promise<string> {
    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.9,
        maxOutputTokens: 800,
        // Gemini 2.5 models enable dynamic "thinking" by default, which consumes
        // the output-token budget on hidden reasoning and can leave NO tokens for
        // the actual JSON (manifesting as an empty response → "no JSON object
        // found"). This task is a short, templated email that needs no reasoning,
        // so disable thinking entirely for reliable, fast, cheap output.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text;
    if (!text || !text.trim()) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  }
}
