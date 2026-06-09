import { z } from "zod";

/** Validated environment. Keys come from .env (via @nestjs/config) / process.env. */
export const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
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
