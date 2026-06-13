import { Logger } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";

import type { BuiltPrompt } from "../prompt/build-prompt";
import type { LlmClient } from "./llm-client";

/**
 * Gemini-backed LlmClient using the current @google/genai SDK.
 * `systemInstruction` carries our guardrails; `responseMimeType: application/json`
 * nudges the model toward parseable output (we still validate it ourselves).
 *
 * Takes an explicit key/model so the factory can stand up several instances with
 * DIFFERENT keys (priority-ordered fallback) — see GenerationModule.
 */
export class GeminiClient implements LlmClient {
  readonly name: string;
  private readonly logger = new Logger(GeminiClient.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(opts: { apiKey: string; model: string; name?: string }) {
    this.ai = new GoogleGenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.name = opts.name ?? "gemini";
  }

  async generateEmailJson(
    prompt: BuiltPrompt,
    opts: { temperature?: number } = {},
  ): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.9,
        // Headroom for the modular JSON (subject + several slots). The body is
        // still capped at 200 words by validateOutput; this just avoids truncation.
        maxOutputTokens: 1200,
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
