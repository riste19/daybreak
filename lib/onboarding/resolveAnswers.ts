/**
 * resolveAnswers — pure function turning onboarding answers into the payload
 * the generation engine consumes.
 *
 * Output contract (what the engine should read):
 *   params:
 *     tone           — single resolved voice (universal.tone wins if set)
 *     intensity      — how blunt/forceful the delivery is (mood.directness), default balanced
 *     focusAreas     — selected categories, weighted + sorted (most → least)
 *     preferredThemes— themes the answers leaned on, weighted + sorted
 *   contextLines     — short, human-readable fragments folded into the prompt's
 *                      context block, ordered by focus weight (strongest first)
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
  type Intensity,
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
  /** How blunt/forceful the delivery is (orthogonal to tone). */
  intensity: Intensity;
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
const DEFAULT_INTENSITY: Intensity = "balanced";

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

interface Accumulators {
  toneVotes: Map<Tone, number>;
  intensityVotes: Map<Intensity, number>;
  themeWeights: Map<Theme, number>;
  focusWeights: Map<string, number>;
}

/** Merge a param contribution into the running accumulators. */
function applyParams(
  contrib: ParamContribution | undefined,
  acc: Accumulators,
  categoryId: string,
) {
  if (!contrib) return;
  if (contrib.tone) acc.toneVotes.set(contrib.tone, (acc.toneVotes.get(contrib.tone) ?? 0) + 1);
  if (contrib.intensity) {
    acc.intensityVotes.set(contrib.intensity, (acc.intensityVotes.get(contrib.intensity) ?? 0) + 1);
  }
  for (const t of contrib.themes ?? []) {
    acc.themeWeights.set(t, (acc.themeWeights.get(t) ?? 0) + 1);
  }
  if (contrib.focusWeight) {
    acc.focusWeights.set(categoryId, (acc.focusWeights.get(categoryId) ?? 0) + contrib.focusWeight);
  }
}

/** Winner of a vote map, with a default when no votes were cast. */
function topVote<T>(votes: Map<T, number>, fallback: T): T {
  let best = fallback;
  let bestCount = 0;
  for (const [value, count] of votes) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function resolveTone(toneVotes: Map<Tone, number>, override?: AnswerValue): Tone {
  if (typeof override === "string" && override) return override as Tone;
  return topVote(toneVotes, DEFAULT_TONE);
}

/* ─────────────────────────────── Main ───────────────────────────────── */

export function resolveAnswers(
  answers: AnswerSet,
  schema: Schema = { categories: defaultCategories, universalQuestions: defaultUniversal },
): ResolvedAnswers {
  const { selectedCategories, values } = answers;
  const selected = new Set(selectedCategories);

  const acc: Accumulators = {
    toneVotes: new Map<Tone, number>(),
    intensityVotes: new Map<Intensity, number>(),
    themeWeights: new Map<Theme, number>(),
    focusWeights: new Map<string, number>(),
  };
  // Tagged with the source category so the final order can follow focus weight.
  const contextEntries: { categoryId: string; line: string }[] = [];
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
    applyParams(r.params, acc, categoryId);
    if (r.paramsByOption) {
      const vals = Array.isArray(value) ? value : [String(value)];
      for (const v of vals) {
        applyParams(r.paramsByOption[v], acc, categoryId);
      }
    }

    // Context: per-option lines take precedence, else the flat template.
    if (r.contextByOption) {
      const vals = Array.isArray(value) ? value : [String(value)];
      for (const v of vals) {
        const tmpl = r.contextByOption[v];
        if (tmpl) {
          const line = fillTemplate(tmpl, q, value);
          if (line) contextEntries.push({ categoryId, line });
        }
      }
    } else if (r.context) {
      const line = fillTemplate(r.context, q, value);
      if (line) contextEntries.push({ categoryId, line });
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

  const tone = resolveTone(acc.toneVotes, values["universal.tone"]);
  const intensity = topVote(acc.intensityVotes, DEFAULT_INTENSITY);

  const focusAreas = [...acc.focusWeights.entries()]
    .map(([id, weight]) => ({ id, weight }))
    .sort((a, b) => b.weight - a.weight);

  // Ensure every selected category appears, even with no focusWeight answers.
  for (const id of selectedCategories) {
    if (!focusAreas.some((f) => f.id === id)) focusAreas.push({ id, weight: 0 });
  }

  const preferredThemes = [...acc.themeWeights.entries()]
    .map(([theme, weight]) => ({ theme, weight }))
    .sort((a, b) => b.weight - a.weight);

  // Order context lines so the user's strongest focus areas lead. Universal
  // lines (name/goal/note) sort last; equal weights keep schema order (stable).
  const weightFor = (categoryId: string): number =>
    categoryId === "universal" ? -Infinity : acc.focusWeights.get(categoryId) ?? 0;
  const contextLines = contextEntries
    .map((entry, i) => ({ ...entry, i }))
    .sort((a, b) => weightFor(b.categoryId) - weightFor(a.categoryId) || a.i - b.i)
    .map((entry) => entry.line);

  return {
    params: { tone, intensity, focusAreas, preferredThemes },
    contextLines,
    flags,
    needsModeration: flags.length > 0,
  };
}
