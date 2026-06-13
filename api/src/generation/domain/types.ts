import { z } from "zod";

/**
 * Domain types for the generation engine.
 *
 * Tone and Theme intentionally mirror the questionnaire's canonical model in
 * `lib/onboarding/onboarding-schema.ts` (lowercase / snake_case) so there is a
 * SINGLE casing across the product — no GENTLE↔gentle mapping layer. This file
 * is the engine-side copy of that contract (the api/ package is standalone).
 */

/* ───────────────────────────── Tone ──────────────────────────────────── */

export const TONES = ["gentle", "direct", "playful", "stoic"] as const;
export const ToneSchema = z.enum(TONES);
export type Tone = z.infer<typeof ToneSchema>;

/* ───────────────────────────── Theme ─────────────────────────────────── */

export const THEMES = [
  "gratitude",
  "momentum",
  "identity",
  "small_wins",
  "resistance",
  "reflection",
] as const;
export const ThemeSchema = z.enum(THEMES);
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Onboarding-derived theme affinity (from resolveAnswers' `params.preferredThemes`).
 * Used ONLY as a tiebreak inside selectTheme — never to override the calendar.
 */
export const PreferredThemeSchema = z.object({
  theme: ThemeSchema,
  weight: z.number().finite(),
});
export type PreferredTheme = z.infer<typeof PreferredThemeSchema>;

/* ─────────────────────────── GenerationInput ─────────────────────────── */

/**
 * The engine's input contract. Aligned to what the questionnaire actually emits:
 *  - name / primaryGoal / customNotes are discrete fields (the prompt's originals)
 *  - contextLines is the personalization payload from resolveAnswers (replaces the
 *    dropped `tasks[]` — each line is short and already screened upstream)
 *  - preferredThemes feeds selectTheme's tiebreak
 *  - recentThemes is supplied by the caller (no persistence in this isolated engine)
 */
/**
 * The engine's slice of the email layout: which AI slots to fill, in order, and
 * the user's "feed" text to weave in & place. Derived from the full layout by
 * the delivery layer (toOutputPlan) so generation stays decoupled from rendering.
 * Verbatim text is NEVER here — the model does not see it.
 */
export const OutputPlanSchema = z.object({
  slots: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
  feed: z.array(z.string().trim().max(300)).max(10).default([]),
});
export type OutputPlan = z.infer<typeof OutputPlanSchema>;

/** Single slot used when no outputPlan is supplied (legacy one-body path). */
export const DEFAULT_SLOT_ID = "main";

export const GenerationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  primaryGoal: z.string().trim().min(1).max(150),
  tone: ToneSchema,
  customNotes: z.string().trim().max(300).optional(),
  contextLines: z.array(z.string().max(200)).max(20).default([]),
  preferredThemes: z.array(PreferredThemeSchema).max(6).default([]),
  recentThemes: z.array(ThemeSchema).max(7).default([]),
  /**
   * The modular output plan. Absent → the engine fills a single default slot,
   * preserving the legacy one-body behaviour.
   */
  outputPlan: OutputPlanSchema.optional(),
  /**
   * Dev-only: overrides the hardcoded SYSTEM_INSTRUCTION for this one request.
   * Used by the debug review screen to tune the prompt interactively. Not part
   * of the product flow — the onboarding path never sends this.
   */
  systemPromptOverride: z.string().trim().min(1).max(4000).optional(),
});
export type GenerationInput = z.infer<typeof GenerationInputSchema>;

/* ────────────────────────── GenerationResult ─────────────────────────── */

export const GenerationResultSchema = z.object({
  subject: z.string(),
  /** Convenience: `sections` joined in slot order. Kept for single-body callers. */
  body: z.string(),
  /** Modular body — one entry per requested AI slot id. */
  sections: z.record(z.string(), z.string()),
  theme: ThemeSchema,
  usedFallback: z.boolean(),
});
export type GenerationResult = z.infer<typeof GenerationResultSchema>;

/**
 * The legacy single-body JSON shape. Still accepted from the model (and used by
 * the fallback bank): validateOutput maps a flat `body` into the first slot.
 */
export const ModelEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type ModelEmail = z.infer<typeof ModelEmailSchema>;

/** The modular JSON shape we now ask the model to return: content per slot id. */
export const ModularEmailSchema = z.object({
  subject: z.string(),
  sections: z.record(z.string(), z.string()),
});
export type ModularEmail = z.infer<typeof ModularEmailSchema>;
