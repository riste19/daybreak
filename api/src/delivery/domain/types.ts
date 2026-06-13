import { z } from "zod";

import { GenerationInputSchema, ThemeSchema } from "../../generation/domain/types";
import { EmailLayoutSchema } from "./layout";

/**
 * Delivery contracts. SendDailyInput is the generation contract plus what
 * delivery adds: where to send, the email layout (the subscriber's mutable
 * section arrangement), and the legacy `personalNote` static-text field. Verbatim
 * text in the layout is shown back in the template and NEVER enters the LLM
 * prompt; "feed" text is consumed by the model. The distinction is enforced here.
 */

/**
 * An already-generated message (e.g. from a /generate/preview the user
 * approved). When present, delivery sends exactly this instead of generating
 * again. Bounds mirror validateOutput's (subject 3–80; body ≤200 words) —
 * the template escapes everything, so markup in here is inert.
 */
export const PreparedMessageSchema = z.object({
  subject: z.string().trim().min(3).max(80),
  body: z.string().trim().min(1).max(2000),
  /** Modular content per AI slot id (from GenerationResult.sections). */
  sections: z.record(z.string(), z.string()).optional(),
  theme: ThemeSchema,
});
export type PreparedMessage = z.infer<typeof PreparedMessageSchema>;

export const SendDailyInputSchema = GenerationInputSchema.extend({
  to: z.string().trim().email().max(254),
  /** Send this exact message instead of generating a fresh one. */
  message: PreparedMessageSchema.optional(),
  /** The subscriber's section arrangement. Absent → the canonical layout. */
  emailLayout: EmailLayoutSchema.optional(),
  /**
   * Legacy single static note. Folded into the layout as one verbatim block.
   * Prefer `emailLayout` with verbatim text sections.
   */
  personalNote: z
    .string()
    .trim()
    .min(1)
    .max(500)
    // Strip control characters; the note is rendered verbatim otherwise.
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]+/g, " ").trim())
    .optional(),
});
export type SendDailyInput = z.infer<typeof SendDailyInputSchema>;

export const SendDailyResultSchema = z.object({
  to: z.string(),
  subject: z.string(),
  theme: ThemeSchema,
  usedFallback: z.boolean(),
  /** Which EmailClient handled it ("resend" | "console"). */
  provider: z.string(),
  /** Provider-assigned message id. */
  messageId: z.string(),
});
export type SendDailyResult = z.infer<typeof SendDailyResultSchema>;
