import type { BuiltPrompt } from "../prompt/build-prompt";

/**
 * The narrow LLM surface the generation engine depends on. Keeping this an
 * interface (not a concrete client) means the service is trivially testable with
 * a fake, and providers can be swapped or chained (see FallbackLlmClient).
 */
export interface LlmClient {
  /**
   * Short provider label for logs (e.g. "gemini", "anthropic"). Optional so test
   * fakes can omit it; concrete providers set it.
   */
  readonly name?: string;

  /**
   * Run one generation and return the model's raw text (expected to be a JSON
   * object {"subject","sections"}). May throw on transport/empty-response errors
   * — the service treats a throw as a failed attempt, and the fallback chain
   * treats it as a signal to try the next provider.
   */
  generateEmailJson(prompt: BuiltPrompt, opts?: { temperature?: number }): Promise<string>;
}

/** DI token for the LlmClient implementation (the provider chain in production). */
export const LLM_CLIENT = Symbol("LLM_CLIENT");
