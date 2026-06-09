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
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(config: AppConfigService) {
    this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.model = config.geminiModel;
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
