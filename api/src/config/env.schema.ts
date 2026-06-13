import { z } from "zod";

/** Validated environment. Keys come from .env (via @nestjs/config) / process.env. */
/** Treat an empty/whitespace env value the same as unset. */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

export const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PORT: z.coerce.number().int().positive().default(3002),
  /** Resend API key. Unset → emails are logged to the console instead of sent. */
  RESEND_API_KEY: optionalString,
  /** Sender. The resend.dev sandbox sender works without verifying a domain. */
  EMAIL_FROM: z.string().min(1).default("Daybreak <onboarding@resend.dev>"),
  EMAIL_REPLY_TO: optionalString,
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
