/**
 * buildGenerationInput — maps onboarding answers into the exact request body the
 * generation engine expects (`POST /generate/preview`).
 *
 * resolveAnswers produces a rich, UI-facing bundle
 *   ({ params:{tone,focusAreas,preferredThemes}, contextLines, flags }),
 * but the engine's GenerationInput is narrower and uses discrete originals for
 * name / primaryGoal / customNotes. This module bridges the two.
 *
 * The GenerationInput / GenerationResult types below intentionally mirror the
 * engine-side contract in api/src/generation/domain/types.ts. The api/ package is
 * standalone, so — like the engine keeps its own copy of Tone/Theme — we keep a
 * local copy here rather than importing across the package boundary.
 *
 * Pure and framework-agnostic, so it can be unit-tested in isolation.
 */

import { resolveAnswers, type AnswerSet } from "./resolveAnswers";
import type { Intensity, Theme, Tone } from "./onboarding-schema";
import type { OutputPlan } from "@/lib/email/layout";

/* ─────────────────────── Engine contract (mirror) ───────────────────────
 * Keep in sync with api/src/generation/domain/types.ts:
 *   GenerationInputSchema / GenerationResultSchema.
 * ----------------------------------------------------------------------- */

export interface PreferredTheme {
  theme: Theme;
  weight: number;
}

export interface FocusArea {
  id: string;
  weight: number;
}

export interface GenerationInput {
  name: string;
  primaryGoal: string;
  tone: Tone;
  /** How blunt/forceful the delivery should be (orthogonal to tone). */
  intensity: Intensity;
  customNotes?: string;
  contextLines: string[];
  /** Selected life areas, weighted + sorted (most → least). Anchors the email. */
  focusAreas: FocusArea[];
  preferredThemes: PreferredTheme[];
  recentThemes: Theme[];
  /**
   * The modular output plan (AI slot ids + feed text), derived from the email
   * layout via toOutputPlan. Added at request time in the review screen — the
   * layout is customizable after this object is first built.
   */
  outputPlan?: OutputPlan;
  /** Dev-only prompt override used by the debug screen; omitted in the product flow. */
  systemPromptOverride?: string;
}

export interface GenerationResult {
  subject: string;
  body: string;
  /** Modular content per AI slot id. Joined into `body` for single-slot callers. */
  sections?: Record<string, string>;
  theme: Theme;
  usedFallback: boolean;
}

/* ─────────────────────────────── Mapping ────────────────────────────────── */

/** name is optional in onboarding but the engine requires a non-empty string. */
const NAME_FALLBACK = "friend";

function asTrimmed(v: AnswerSet["values"][string] | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Drop the context lines that merely restate the discrete fields. resolveAnswers
 * folds name/goal/note into contextLines (see onboarding-schema universal
 * questions), but the engine prints name/primaryGoal/customNotes separately and
 * also dumps contextLines — passing both would duplicate each fact in the prompt.
 * The note line can also exceed the engine's 200-char/line cap, so it must go.
 */
function stripDuplicateLines(lines: string[], note: string): string[] {
  return lines.filter(
    (line) =>
      !line.startsWith("Their name is ") &&
      !line.startsWith("Primary goal: ") &&
      !(note !== "" && line === note),
  );
}

/**
 * Build the engine request body from a raw onboarding answer set. Runs
 * resolveAnswers internally so this stays the single source of truth for the
 * payload.
 */
export function buildGenerationInput(answers: AnswerSet): GenerationInput {
  const resolved = resolveAnswers(answers);
  const { values } = answers;

  const name = asTrimmed(values["universal.name"]) || NAME_FALLBACK;
  const primaryGoal = asTrimmed(values["universal.goal"]);
  const customNotes = asTrimmed(values["universal.note"]);

  const input: GenerationInput = {
    name,
    primaryGoal,
    tone: resolved.params.tone,
    intensity: resolved.params.intensity,
    contextLines: stripDuplicateLines(resolved.contextLines, customNotes),
    focusAreas: resolved.params.focusAreas,
    preferredThemes: resolved.params.preferredThemes,
    recentThemes: [],
  };

  if (customNotes) input.customNotes = customNotes;

  return input;
}
