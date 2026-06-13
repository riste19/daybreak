import { z } from "zod";

/**
 * Engine-side mirror of the email layout contract (frontend copy:
 * lib/email/layout.ts). The api/ package is standalone, so — like Tone/Theme and
 * GenerationInput — we keep a local zod copy rather than importing across the
 * package boundary. Keep the two in sync.
 *
 * A layout is an ORDERED stack of sections the subscriber arranged:
 *  - chrome : system framing (header/heading/signature/meta/footer).
 *  - text   : the subscriber's own words. handling "verbatim" → rendered as-is,
 *             escaped, NEVER seen by the model. handling "feed" → handed to the
 *             model as material to place, NOT rendered as its own block.
 *  - ai     : a slot the model fills (response.sections[id]).
 */

/** Strip control characters; the text is rendered verbatim otherwise. */
const CONTROL_CHARS_RE = new RegExp("[\\u0000-\\u001F\\u007F]+", "g");

export const CHROME_ROLES = [
  "header",
  "heading",
  "signature",
  "meta",
  "footer",
] as const;
export const ChromeRoleSchema = z.enum(CHROME_ROLES);
export type ChromeRole = z.infer<typeof ChromeRoleSchema>;

export const SectionHandlingSchema = z.enum(["verbatim", "feed"]);
export type SectionHandling = z.infer<typeof SectionHandlingSchema>;

export const ChromeSectionSchema = z.object({
  kind: z.literal("chrome"),
  role: ChromeRoleSchema,
});

export const TextSectionSchema = z.object({
  kind: z.literal("text"),
  id: z.string().trim().min(1).max(40),
  // Bounds mirror personalNote (≤500); control chars stripped, rendered verbatim.
  text: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .transform((v) => v.replace(CONTROL_CHARS_RE, " ").trim()),
  handling: SectionHandlingSchema,
  /** Optional uppercase label above a verbatim block (e.g. "A note from you"). */
  label: z.string().trim().max(60).optional(),
});

export const AiSectionSchema = z.object({
  kind: z.literal("ai"),
  id: z.string().trim().min(1).max(40),
});

export const EmailSectionSchema = z.discriminatedUnion("kind", [
  ChromeSectionSchema,
  TextSectionSchema,
  AiSectionSchema,
]);
export type EmailSection = z.infer<typeof EmailSectionSchema>;
export type ChromeSection = z.infer<typeof ChromeSectionSchema>;
export type TextSection = z.infer<typeof TextSectionSchema>;
export type AiSection = z.infer<typeof AiSectionSchema>;

export const EmailLayoutSchema = z.object({
  version: z.literal(1),
  sections: z.array(EmailSectionSchema).min(1).max(30),
});
export type EmailLayout = z.infer<typeof EmailLayoutSchema>;

export const DEFAULT_AI_SLOT_ID = "main";

/** Reproduces today's fixed template exactly (one AI body). */
export const DEFAULT_LAYOUT: EmailLayout = {
  version: 1,
  sections: [
    { kind: "chrome", role: "header" },
    { kind: "chrome", role: "heading" },
    { kind: "ai", id: DEFAULT_AI_SLOT_ID },
    { kind: "chrome", role: "signature" },
    { kind: "chrome", role: "meta" },
    { kind: "chrome", role: "footer" },
  ],
};

export interface OutputPlan {
  slots: string[];
  feed: string[];
}

/**
 * Derive the generation OutputPlan from a layout: ordered AI slot ids + "feed"
 * text. Verbatim text is excluded (the model never sees it). Falls back to the
 * single default slot so generation always has a slot to fill.
 */
export function toOutputPlan(layout: EmailLayout): OutputPlan {
  const slots = layout.sections
    .filter((s): s is AiSection => s.kind === "ai")
    .map((s) => s.id);
  const feed = layout.sections
    .filter((s): s is TextSection => s.kind === "text" && s.handling === "feed")
    .map((s) => s.text.trim())
    .filter((t) => t.length > 0);
  return { slots: slots.length > 0 ? slots : [DEFAULT_AI_SLOT_ID], feed };
}
