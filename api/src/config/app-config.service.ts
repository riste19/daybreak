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

  /**
   * All configured Gemini keys, in priority order. Splits the comma-separated
   * GEMINI_API_KEY and drops blanks/dupes — the client fails over down this list.
   */
  get geminiApiKeys(): string[] {
    const raw = this.config.get("GEMINI_API_KEY", { infer: true });
    const keys = raw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    return [...new Set(keys)];
  }

  get geminiModel(): string {
    return this.config.get("GEMINI_MODEL", { infer: true });
  }

  get port(): number {
    return this.config.get("PORT", { infer: true });
  }
}
