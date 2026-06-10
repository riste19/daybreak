/**
 * resolveAnswers — pure function turning onboarding answers into the payload
 * the generation engine consumes.
 *
 * Output contract (what the engine should read):
 *   params:
 *     tone           — single resolved voice (universal.tone wins if set)
 *     focusAreas     — selected categories, weighted + sorted (most → least)
 *     preferredThemes— themes the answers leaned on, weighted + sorted
 *   contextLines     — short, human-readable fragments folded into the prompt's
 *                      context block, in a stable order
 *   flags            — anything the moderation layer must look at
 *   needsModeration  — convenience boolean (flags.length > 0)
 *
 * Safety (per category notes in the schema):
 *   - `moderate: true` free-text is run through screenText().
 *   - Distress signals are NOT interpreted here — the line is dropped and a
 *     flag is raised for the existing moderation layer; we fall back to a
 *     gentle default and keep going.
 *   - Health collects no free text by design, so no medical content reaches us.
 *
 * This module is framework-agnostic and has no side effects.
 */

import {
  categories as defaultCategories,
  universalQuestions as defaultUniversal,
  CAPS,
  type Category,
  type Question,
  type ParamContribution,
  type ShowIf,
  type Theme,
  type Tone,
} from "./onboarding-schema";

/* ─────────────────────────────── Types ──────────────────────────────── */

export type AnswerValue = string | string[] | number;

export interface AnswerSet {
  /** Category ids the user opted into. Only these contribute. */
  selectedCategories: string[];
  /** Answers keyed by question id (includes universal.* ids). */
  values: Record<string, AnswerValue>;
}

export interface ResolvedParams {
  tone: Tone;
  focusAreas: { id: string; weight: number }[];
  preferredThemes: { theme: Theme; weight: number }[];
}

export type FlagReason = "distress" | "injection" | "gibberish";

export interface ModerationFlag {
  questionId: string;
  reason: FlagReason;
}

export interface ResolvedAnswers {
  params: ResolvedParams;
  contextLines: string[];
  flags: ModerationFlag[];
  needsModeration: boolean;
}

interface Schema {
  categories: Category[];
  universalQuestions: Question[];
}

const DEFAULT_TONE: Tone = "gentle";

/* ───────────────────────── Lightweight moderation ───────────────────────
 * Placeholder for the REAL input-moderation layer. The contract that matters
 * downstream: distress → drop + flag (never interpreted here); prompt-injection
 * → drop + flag; near-empty gibberish → drop + flag. Swap the internals for the
 * production moderator without changing resolveAnswers' shape.
 * ----------------------------------------------------------------------- */

const DISTRESS_RE =
  /\b(kill myself|suicid|self[\s-]?harm|hurt myself|want to die|end it all|hopeless|can'?t go on|no reason to live)\b/i;

const INJECTION_RE =
  /\b(?:ignore|disregard|forget)\b[^.]{0,30}\b(?:instructions|prompts?|context)\b|\bsystem prompt\b|\byou are now\b|\bact as\b|\bjailbreak\b/i;

export function screenText(
  raw: string,
): { ok: true; text: string } | { ok: false; reason: FlagReason } {
  const text = raw.trim();
  if (DISTRESS_RE.test(text)) return { ok: false, reason: "distress" };
  if (INJECTION_RE.test(text)) return { ok: false, reason: "injection" };
  // Gibberish: has content but no run of letters that looks like a word.
  if (text.length >= 4 && !/[a-z]{2,}/i.test(text)) {
    return { ok: false, reason: "gibberish" };
  }
  return { ok: true, text };
}

/* ───────────────────────────── Helpers ──────────────────────────────── */

function isBlank(v: AnswerValue | undefined): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Evaluate a showIf predicate against the current answers. */
function passesShowIf(showIf: ShowIf, values: Record<string, AnswerValue>): boolean {
  const v = values[showIf.questionId];
  if (isBlank(v)) return false;
  switch (showIf.operator) {
    case "equals":
      return v === showIf.value;
    case "includes":
      return Array.isArray(v) && v.includes(showIf.value as string);
    case "gt":
      return Number(v) > Number(showIf.value);
    case "lt":
      return Number(v) < Number(showIf.value);
    default:
      return false;
  }
}

/** Enforce caps: truncate text to maxLength, multi-selects to CAPS.multi. */
function applyCaps(q: Question, value: AnswerValue): AnswerValue {
  if (typeof value === "string") {
    const cap = q.maxLength ?? CAPS.text;
    return value.length > cap ? value.slice(0, cap) : value;
  }
  if (Array.isArray(value)) {
    return value.length > CAPS.multi ? value.slice(0, CAPS.multi) : value;
  }
  return value;
}

/** Resolve option labels for a value (single or multi), for {label} tokens. */
function labelsFor(q: Question, value: AnswerValue): string {
  const opts = q.options ?? [];
  const lookup = (val: string) => opts.find((o) => o.value === val)?.label ?? val;
  if (Array.isArray(value)) return value.map(lookup).join(", ");
  if (typeof value === "string") return lookup(value);
  return String(value);
}

function valueToken(value: AnswerValue): string {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function fillTemplate(template: string, q: Question, value: AnswerValue): string {
  const labels = labelsFor(q, value);
  return template
    .replaceAll("{value}", valueToken(value))
    .replaceAll("{labels}", labels)
    .replaceAll("{label}", labels)
    .trim();
}

/** Merge a param contribution into the running accumulators. */
function applyParams(
  contrib: ParamContribution | undefined,
  toneVotes: Map<Tone, number>,
  themeWeights: Map<Theme, number>,
  focusWeights: Map<string, number>,
  categoryId: string,
) {
  if (!contrib) return;
  if (contrib.tone) toneVotes.set(contrib.tone, (toneVotes.get(contrib.tone) ?? 0) + 1);
  for (const t of contrib.themes ?? []) {
    themeWeights.set(t, (themeWeights.get(t) ?? 0) + 1);
  }
  if (contrib.focusWeight) {
    focusWeights.set(categoryId, (focusWeights.get(categoryId) ?? 0) + contrib.focusWeight);
  }
}

function resolveTone(toneVotes: Map<Tone, number>, override?: AnswerValue): Tone {
  if (typeof override === "string" && override) return override as Tone;
  let best: Tone = DEFAULT_TONE;
  let bestCount = 0;
  for (const [tone, count] of toneVotes) {
    if (count > bestCount) {
      best = tone;
      bestCount = count;
    }
  }
  return best;
}

/* ─────────────────────────────── Main ───────────────────────────────── */

export function resolveAnswers(
  answers: AnswerSet,
  schema: Schema = { categories: defaultCategories, universalQuestions: defaultUniversal },
): ResolvedAnswers {
  const { selectedCategories, values } = answers;
  const selected = new Set(selectedCategories);

  const toneVotes = new Map<Tone, number>();
  const themeWeights = new Map<Theme, number>();
  const focusWeights = new Map<string, number>();
  const contextLines: string[] = [];
  const flags: ModerationFlag[] = [];

  /** Resolve one question's answer into params + an optional context line. */
  const resolveQuestion = (q: Question, categoryId: string) => {
    const raw = values[q.id];
    if (isBlank(raw)) return;

    // Skip questions hidden by an unmet showIf — they must not contribute.
    if (q.showIf && !passesShowIf(q.showIf, values)) return;

    let value = applyCaps(q, raw);

    // Moderate free text before it can become a context line.
    if (q.moderate && typeof value === "string") {
      const screened = screenText(value);
      if (!screened.ok) {
        // Do NOT interpret — flag for the moderation layer and drop the line.
        flags.push({ questionId: q.id, reason: screened.reason });
        // Params from this question are skipped too; gentle default stands.
        return;
      }
      value = screened.text;
    }

    const r = q.resolve;
    if (!r) return;

    // Params: flat first, then per-option for the chosen value(s).
    applyParams(r.params, toneVotes, themeWeights, focusWeights, categoryId);
    if (r.paramsByOption) {
      const vals = Array.isArray(value) ? value : [String(value)];
      for (const v of vals) {
        applyParams(r.paramsByOption[v], toneVotes, themeWeights, focusWeights, categoryId);
      }
    }

    // Context: per-option lines take precedence, else the flat template.
    if (r.contextByOption) {
      const vals = Array.isArray(value) ? value : [String(value)];
      for (const v of vals) {
        const tmpl = r.contextByOption[v];
        if (tmpl) {
          const line = fillTemplate(tmpl, q, value);
          if (line) contextLines.push(line);
        }
      }
    } else if (r.context) {
      const line = fillTemplate(r.context, q, value);
      if (line) contextLines.push(line);
    }
  };

  // Only selected categories contribute. Universal always resolves.
  for (const cat of schema.categories) {
    if (!selected.has(cat.id)) continue;
    for (const q of cat.questions) resolveQuestion(q, cat.id);
  }
  for (const q of schema.universalQuestions) {
    resolveQuestion(q, "universal");
  }

  const tone = resolveTone(toneVotes, values["universal.tone"]);

  const focusAreas = [...focusWeights.entries()]
    .map(([id, weight]) => ({ id, weight }))
    .sort((a, b) => b.weight - a.weight);

  // Ensure every selected category appears, even with no focusWeight answers.
  for (const id of selectedCategories) {
    if (!focusAreas.some((f) => f.id === id)) focusAreas.push({ id, weight: 0 });
  }

  const preferredThemes = [...themeWeights.entries()]
    .map(([theme, weight]) => ({ theme, weight }))
    .sort((a, b) => b.weight - a.weight);

  return {
    params: { tone, focusAreas, preferredThemes },
    contextLines,
    flags,
    needsModeration: flags.length > 0,
  };
}
