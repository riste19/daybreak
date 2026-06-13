import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "./env.schema";

/**
 * Typed accessor over Nest's ConfigService. Code reads `config.geminiApiKey`
 * rather than stringly-typed `get("GEMINI_API_KEY")`, and the env is already
 * validated (see validateEnv) so these never return undefined.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get geminiApiKey(): string {
    return this.config.get("GEMINI_API_KEY", { infer: true });
  }

  get geminiModel(): string {
    return this.config.get("GEMINI_MODEL", { infer: true });
  }

  /**
   * Priority-ordered Gemini keys. Falls back to the single GEMINI_API_KEY when
   * GEMINI_API_KEYS is unset. Always returns at least one key.
   */
  get geminiApiKeys(): string[] {
    const list = this.config.get("GEMINI_API_KEYS", { infer: true });
    if (list) {
      const keys = list
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      if (keys.length > 0) return keys;
    }
    return [this.geminiApiKey];
  }

  get anthropicApiKey(): string | undefined {
    return this.config.get("ANTHROPIC_API_KEY", { infer: true });
  }

  get anthropicModel(): string {
    return this.config.get("ANTHROPIC_MODEL", { infer: true });
  }

  get port(): number {
    return this.config.get("PORT", { infer: true });
  }

  get resendApiKey(): string | undefined {
    return this.config.get("RESEND_API_KEY", { infer: true });
  }

  get emailFrom(): string {
    return this.config.get("EMAIL_FROM", { infer: true });
  }

  get emailReplyTo(): string | undefined {
    return this.config.get("EMAIL_REPLY_TO", { infer: true });
  }
}
