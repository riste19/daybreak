/**
 * The email layout — a mutable user preference describing the daily email as an
 * ORDERED STACK OF SECTIONS the user arranges (drag-to-reorder in the builder).
 *
 * This is the frontend copy of the contract. The engine keeps its own zod mirror
 * at api/src/delivery/domain/layout.ts (the api/ package is standalone — the repo
 * keeps mirrored copies of cross-boundary contracts rather than importing across
 * the package line; see lib/onboarding/buildGenerationInput.ts for the same
 * pattern with GenerationInput). Keep the two in sync.
 *
 * Section kinds:
 *  - chrome : framing the system renders (header/heading/signature/meta/footer).
 *             Present = shown; remove to hide.
 *  - text   : the user's own words. `handling` decides what happens to them:
 *               • "verbatim" → rendered exactly as typed, escaped. The model
 *                 NEVER sees it (template-only).
 *               • "feed"     → handed to the model as material to weave in and
 *                 place; NOT rendered as its own block.
 *  - ai     : a slot the model fills. The model returns content per slot id in a
 *             single response (`{ subject, sections: { <id>: string } }`), and
 *             the renderer drops each slot's text in at this position.
 */

export type SectionHandling = "verbatim" | "feed";

/** The chrome roles, in their natural top→bottom order. */
export const CHROME_ROLES = [
  "header", // dawn strip + wordmark
  "heading", // the subject, as the display heading
  "signature", // "— Daybreak"
  "meta", // tone / theme strip
  "footer", // tagline + unsubscribe
] as const;
export type ChromeRole = (typeof CHROME_ROLES)[number];

export interface ChromeSection {
  kind: "chrome";
  role: ChromeRole;
}

export interface TextSection {
  kind: "text";
  id: string;
  text: string;
  handling: SectionHandling;
  /** Optional uppercase label above a verbatim block (e.g. "A note from you"). */
  label?: string;
}

export interface AiSection {
  kind: "ai";
  id: string;
}

export type EmailSection = ChromeSection | TextSection | AiSection;

export interface EmailLayout {
  version: 1;
  sections: EmailSection[];
}

/** Id of the single AI slot in the default layout (also the legacy-body slot). */
export const DEFAULT_AI_SLOT_ID = "main";

/**
 * The default layout — reproduces today's fixed template exactly: dawn header,
 * subject heading, one AI body, signature, meta strip, footer. A user who
 * customizes nothing gets the email they get today.
 */
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

/** The generation engine's slice of the layout: which AI slots to fill + feed. */
export interface OutputPlan {
  /** Ordered AI slot ids the model must fill in one response. */
  slots: string[];
  /** User text to weave in & place (handling: "feed"). Never the verbatim text. */
  feed: string[];
}

/**
 * Derive the OutputPlan from a layout: ordered AI slot ids + the "feed" text.
 * Verbatim text is deliberately excluded — the model never sees it. Falls back
 * to the single default slot so generation always has at least one slot to fill.
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

/** Collision-resistant id for new sections created in the builder. */
export function makeSectionId(prefix: "t" | "a"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}
