import { z } from "zod";

/** Validated environment. Keys come from .env (via @nestjs/config) / process.env. */
/** Treat an empty/whitespace env value the same as unset. */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

export const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  /**
   * Optional priority-ordered list of Gemini keys (comma-separated). When set,
   * the engine tries each in order and fails over to the next on error — e.g.
   * "<exhausted-key>,<working-key>". Overrides the single GEMINI_API_KEY.
   */
  GEMINI_API_KEYS: optionalString,
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  /**
   * Anthropic key for the fallback provider. Unset → only Gemini is used; set →
   * the engine fails over to Claude Haiku when Gemini errors (e.g. out of quota).
   */
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  PORT: z.coerce.number().int().positive().default(3002),
  /** Resend API key. Unset → emails are logged to the console instead of sent. */
  RESEND_API_KEY: optionalString,
  /** Sender. The resend.dev sandbox sender works without verifying a domain. */
  EMAIL_FROM: z.string().min(1).default("Daybreak <onboarding@resend.dev>"),
  EMAIL_REPLY_TO: optionalString,
  /** Public app URL — used for the email's unsubscribe link. Set to the live site. */
  APP_URL: z.string().min(1).default("https://daybreak.email"),
  /**
   * Shared secret the Next.js app sends as the `x-api-key` header to authenticate
   * calls to this engine (see EngineAuthGuard). Must match the Next app's
   * ENGINE_API_KEY. Unset is tolerated in dev; in production the engine refuses
   * unauthenticated requests so a public engine URL can't be abused.
   */
  ENGINE_API_KEY: optionalString,
});

export type Env = z.infer<typeof EnvSchema>;

/** Fail fast at boot with a readable message if config is missing/invalid. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${detail}`);
  }
  return parsed.data;
}
