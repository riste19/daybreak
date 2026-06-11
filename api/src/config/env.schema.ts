import { z } from "zod";

/** Validated environment. Keys come from .env (via @nestjs/config) / process.env. */
export const EnvSchema = z.object({
  // One or more Gemini API keys, comma-separated. The client tries them in order
  // and fails over to the next on error (rate limit, quota, bad key), so a single
  // exhausted key doesn't take generation down. A lone key works unchanged.
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required")
    .refine((v) => v.split(",").some((k) => k.trim().length > 0), {
      message: "GEMINI_API_KEY must contain at least one non-empty key",
    }),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PORT: z.coerce.number().int().positive().default(3001),
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
