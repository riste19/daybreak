import type { BuiltPrompt } from "../prompt/build-prompt";

/**
 * The narrow LLM surface the generation engine depends on. Keeping this an
 * interface (not the concrete GeminiClient) means the service is trivially
 * testable with a fake, and a different provider could be swapped in later.
 */
export interface LlmClient {
  /**
   * Run one generation and return the model's raw text (expected to be a JSON
   * object {"subject","body"}). May throw on transport/empty-response errors —
   * the service treats a throw as a failed attempt.
   */
  generateEmailJson(prompt: BuiltPrompt, opts?: { temperature?: number }): Promise<string>;
}

/** DI token for the LlmClient implementation (GeminiClient in production). */
export const LLM_CLIENT = Symbol("LLM_CLIENT");
