import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";

import { AppConfigService } from "../config/app-config.service";

/**
 * Global guard that protects the engine's HTTP surface with a shared secret.
 *
 * The Next.js app calls this engine server-to-server and sends the secret as the
 * `x-api-key` header (see lib/engine.ts). Behaviour:
 *  • ENGINE_API_KEY set   → the header must match, else 401.
 *  • ENGINE_API_KEY unset → allowed in dev (no NODE_ENV / development / test) for
 *    convenience, but REFUSED in production so a public engine URL is never open.
 */
@Injectable()
export class EngineAuthGuard implements CanActivate {
  private readonly logger = new Logger(EngineAuthGuard.name);

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const key = this.config.engineApiKey;

    if (!key) {
      const env = process.env.NODE_ENV;
      if (env === undefined || env === "development" || env === "test") {
        return true;
      }
      this.logger.error(
        "ENGINE_API_KEY is not set — refusing requests outside development.",
      );
      throw new UnauthorizedException(
        "Engine is not configured for authenticated access.",
      );
    }

    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const raw = req.headers["x-api-key"];
    const provided = Array.isArray(raw) ? raw[0] : raw;

    if (provided !== key) {
      throw new UnauthorizedException("Invalid or missing x-api-key.");
    }
    return true;
  }
}
