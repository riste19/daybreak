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
export const GenerationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  primaryGoal: z.string().trim().min(1).max(150),
  tone: ToneSchema,
  customNotes: z.string().trim().max(300).optional(),
  contextLines: z.array(z.string().max(200)).max(20).default([]),
  preferredThemes: z.array(PreferredThemeSchema).max(6).default([]),
  recentThemes: z.array(ThemeSchema).max(7).default([]),
});
export type GenerationInput = z.infer<typeof GenerationInputSchema>;

/* ────────────────────────── GenerationResult ─────────────────────────── */

export const GenerationResultSchema = z.object({
  subject: z.string(),
  body: z.string(),
  theme: ThemeSchema,
  usedFallback: z.boolean(),
});
export type GenerationResult = z.infer<typeof GenerationResultSchema>;

/** The raw JSON shape we ask the model to return (subject + body only). */
export const ModelEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type ModelEmail = z.infer<typeof ModelEmailSchema>;
