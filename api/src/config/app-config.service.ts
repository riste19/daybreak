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

  get port(): number {
    return this.config.get("PORT", { infer: true });
  }
}
