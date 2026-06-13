import type { GenerationInput } from "../domain/types";

/**
 * Input moderation — pure, synchronous, unit-testable.
 *
 * Ported from the questionnaire's `screenText` (lib/onboarding/resolveAnswers.ts)
 * so the engine keeps the SAME safety coverage the product already shipped —
 * crucially including the distress path, which the original engine spec omitted.
 *
 * Contract:
 *  - distress in ANY field            → block the whole request (caller → fallback)
 *  - empty/gibberish in a REQUIRED    → block the whole request
 *    free-text field (name, goal)
 *  - injection/empty/gibberish in     → strip that field, keep going, flag it
 *    customNotes
 *  - bad individual contextLines      → drop that line, keep going, flag it
 *
 * EXTENSION POINT: a future LLM-based moderation pass should slot in as an async
 * second stage AFTER this one (e.g. `moderateInputLlm(result.input)`), gated so
 * the cheap deterministic checks here always run first.
 */

export type FlagReason = "distress" | "injection" | "gibberish" | "empty";

export interface ModerationFlag {
  field: string;
  reason: FlagReason;
}

export type ModerationResult =
  | { ok: true; input: GenerationInput; flags: ModerationFlag[] }
  | { ok: false; flags: ModerationFlag[] };

/* ───────────────────────────── Detectors ────────────────────────────── */

// Mirrors lib/onboarding/resolveAnswers.ts. Keep these in sync if either moves.
const DISTRESS_RE =
  /\b(kill myself|suicid|self[\s-]?harm|hurt myself|want to die|end it all|hopeless|can'?t go on|no reason to live)\b/i;

const INJECTION_RE =
  /\b(?:ignore|disregard|forget)\b[^.]{0,30}\b(?:instructions?|prompts?|context|above|previous)\b|\bsystem prompt\b|\byou are now\b|\bact as\b|\bjailbreak\b|\bdisregard\b/i;

/** Below this length a string is too short to confidently call gibberish. */
const GIBBERISH_MIN_LEN = 5;

export function isBlank(value: string | undefined): boolean {
  return value == null || value.trim() === "";
}

/**
 * Gibberish heuristic (per spec): a string long enough to judge that either has
 * no vowels at all, or is more than half non-letters.
 */
export function isGibberish(value: string): boolean {
  const text = value.trim();
  if (text.length < GIBBERISH_MIN_LEN) return false;

  const compact = text.replace(/\s+/g, "");
  if (compact.length === 0) return false;

  const letters = (compact.match(/[a-z]/gi) ?? []).length;
  const vowels = (compact.match(/[aeiou]/gi) ?? []).length;

  if (vowels === 0) return true; // no vowels over the length threshold
  if ((compact.length - letters) / compact.length > 0.5) return true; // >50% non-letters
  return false;
}

export function hasInjection(value: string): boolean {
  return INJECTION_RE.test(value);
}

export function hasDistress(value: string): boolean {
  return DISTRESS_RE.test(value);
}

/* ───────────────────────────── Orchestration ────────────────────────── */

export function moderateInput(input: GenerationInput): ModerationResult {
  const flags: ModerationFlag[] = [];

  // 1. Distress anywhere → hard block. The engine must not improvise here.
  const distressField = firstDistressField(input);
  if (distressField) {
    flags.push({ field: distressField, reason: "distress" });
    return { ok: false, flags };
  }

  // 2. Required free-text must be present + intelligible.
  for (const field of ["name", "primaryGoal"] as const) {
    const value = input[field];
    if (isBlank(value)) {
      flags.push({ field, reason: "empty" });
      return { ok: false, flags };
    }
    if (isGibberish(value)) {
      flags.push({ field, reason: "gibberish" });
      return { ok: false, flags };
    }
  }

  // 3. customNotes is optional → on any problem, strip it and keep going.
  let customNotes = input.customNotes;
  if (customNotes !== undefined) {
    if (hasInjection(customNotes)) {
      flags.push({ field: "customNotes", reason: "injection" });
      customNotes = undefined;
    } else if (isBlank(customNotes)) {
      flags.push({ field: "customNotes", reason: "empty" });
      customNotes = undefined;
    } else if (isGibberish(customNotes)) {
      flags.push({ field: "customNotes", reason: "gibberish" });
      customNotes = undefined;
    }
  }

  // 4. contextLines are pre-screened upstream; drop any bad line defensively.
  const contextLines = input.contextLines.filter((line) => {
    if (hasInjection(line)) {
      flags.push({ field: "contextLines", reason: "injection" });
      return false;
    }
    if (isGibberish(line)) {
      flags.push({ field: "contextLines", reason: "gibberish" });
      return false;
    }
    return true;
  });

  // 5. outputPlan.feed is user text headed into the prompt — screen it like
  //    contextLines: drop any line that tries to inject or is gibberish.
  const outputPlan = input.outputPlan
    ? {
        ...input.outputPlan,
        feed: input.outputPlan.feed.filter((line) => {
          if (hasInjection(line)) {
            flags.push({ field: "outputPlan.feed", reason: "injection" });
            return false;
          }
          if (isGibberish(line)) {
            flags.push({ field: "outputPlan.feed", reason: "gibberish" });
            return false;
          }
          return true;
        }),
      }
    : input.outputPlan;

  return { ok: true, input: { ...input, customNotes, contextLines, outputPlan }, flags };
}

function firstDistressField(input: GenerationInput): string | undefined {
  if (hasDistress(input.name)) return "name";
  if (hasDistress(input.primaryGoal)) return "primaryGoal";
  if (input.customNotes && hasDistress(input.customNotes)) return "customNotes";
  if (input.contextLines.some(hasDistress)) return "contextLines";
  if (input.outputPlan?.feed.some(hasDistress)) return "outputPlan.feed";
  return undefined;
}
