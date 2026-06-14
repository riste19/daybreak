/**
 * preferences — the single bridge between the raw onboarding answer map and the
 * persisted `user_preferences` columns.
 *
 * Two directions, both pure:
 *   answersToPreferences  — answers  → DB columns (tone, send_time, goal, notes,
 *                            focus_categories, preferred_themes) + the raw answers
 *                            snapshot + the display name.
 *   preferencesToAnswers  — a stored row → the answer map the edit form rehydrates.
 *
 * The discrete columns are the DERIVED view the generation engine reads; `answers`
 * is the source of truth the advanced edit page round-trips (so deep per-category
 * questions survive an edit). Keeping the mapping here means the edit page and
 * signup pre-fill (provisionSubscriber) agree on exactly one shape.
 *
 * Framework-agnostic and side-effect free — unit-testable in isolation.
 */

import { resolveAnswers, type AnswerSet, type AnswerValue } from "./resolveAnswers";
import type { Theme, Tone } from "./onboarding-schema";

/* ─────────────────────────── Send time + timezone ───────────────────────────
 * send_time is a precise local time-of-day stored as "HH:MM" (24h, migration 006);
 * timezone is an IANA zone id (e.g. 'Europe/Skopje'). Both are delivery metadata.
 * ----------------------------------------------------------------------- */

const HHMM_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const DEFAULT_SEND_TIME = "07:00";
const DEFAULT_TIMEZONE = "UTC";

/** Normalize an arbitrary answer value to a valid "HH:MM", else the default. */
function toSendTime(value: AnswerValue | undefined): string {
  return typeof value === "string" && HHMM_RE.test(value.trim())
    ? value.trim()
    : DEFAULT_SEND_TIME;
}

/** Format an "HH:MM" (24h) send time as a friendly 12-hour label, e.g. "7:30am". */
export function formatSendTime(value: string): string {
  const v = value.trim();
  if (!HHMM_RE.test(v)) return value;
  const hour = Number(v.slice(0, 2));
  const minute = v.slice(3, 5);
  const period = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute}${period}`;
}

/** Universal answer ids that live on `users`, not in the answers snapshot. */
const NON_PREFERENCE_KEYS = new Set(["universal.email", "universal.name"]);

/* ───────────────────────────────── Types ────────────────────────────────── */

export interface DerivedPreferences {
  tone: Tone;
  /** Local time-of-day, "HH:MM" (24h). */
  send_time: string;
  /** IANA timezone id (e.g. 'Europe/Skopje'). */
  timezone: string;
  primary_goal: string | null;
  custom_notes: string | null;
  focus_categories: string[];
  preferred_themes: { theme: Theme; weight: number }[];
  /** The full raw answer map → user_preferences.answers (email/name stripped). */
  answers: Record<string, AnswerValue>;
  /** The display name → users.name; null when not provided. */
  name: string | null;
}

/** Loose row shape so callers can pass a Supabase Row (Json fields) directly. */
export interface PreferencesRowLike {
  tone?: string | null;
  send_time?: string | null;
  timezone?: string | null;
  primary_goal?: string | null;
  custom_notes?: string | null;
  focus_categories?: unknown;
  answers?: unknown;
}

/* ───────────────────────────────── Helpers ──────────────────────────────── */

function asTrimmed(v: AnswerValue | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Keep only well-formed answer values (string | string[] | number). */
function coerceAnswers(value: unknown): Record<string, AnswerValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, AnswerValue> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number" || isStringArray(v)) {
      out[k] = v;
    }
  }
  return out;
}

function coerceCategories(value: unknown): string[] {
  return isStringArray(value) ? value : [];
}

/* ─────────────────────────── answers → columns ──────────────────────────── */

/**
 * Derive the persisted preference columns from a raw answer set. Runs
 * resolveAnswers internally, so it stays the single source of truth for tone +
 * themes. `email`/`name` are stripped from the stored snapshot (they live on
 * `users`); the name is surfaced separately on the result.
 */
export function answersToPreferences(answers: AnswerSet): DerivedPreferences {
  const resolved = resolveAnswers(answers);
  const { values, selectedCategories } = answers;

  const send_time = toSendTime(values["universal.sendTime"]);
  const tzRaw = asTrimmed(values["universal.timezone"]);
  const timezone = tzRaw || DEFAULT_TIMEZONE;

  const primaryGoal = asTrimmed(values["universal.goal"]);
  const customNotes = asTrimmed(values["universal.note"]);
  const name = asTrimmed(values["universal.name"]);

  // Store every answer except the fields that belong on `users`.
  const snapshot: Record<string, AnswerValue> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!NON_PREFERENCE_KEYS.has(k)) snapshot[k] = v;
  }

  return {
    tone: resolved.params.tone,
    send_time,
    timezone,
    primary_goal: primaryGoal || null,
    custom_notes: customNotes || null,
    focus_categories: [...selectedCategories],
    preferred_themes: resolved.params.preferredThemes,
    answers: snapshot,
    name: name || null,
  };
}

/* ─────────────────────────── columns → answers ──────────────────────────── */

/**
 * Rebuild the answer map the edit form hydrates from. Prefers the stored
 * `answers` snapshot; falls back to the discrete columns for the universal
 * fields (so rows created before migration 004 still populate sensibly). The
 * display `name` always comes from `users` (authoritative), never the snapshot.
 */
export function preferencesToAnswers(
  prefs: PreferencesRowLike,
  name: string | null,
): AnswerSet {
  const values = coerceAnswers(prefs.answers);

  if (values["universal.goal"] == null && prefs.primary_goal) {
    values["universal.goal"] = prefs.primary_goal;
  }
  if (values["universal.note"] == null && prefs.custom_notes) {
    values["universal.note"] = prefs.custom_notes;
  }
  if (values["universal.tone"] == null && prefs.tone) {
    values["universal.tone"] = prefs.tone;
  }
  if (values["universal.sendTime"] == null) {
    values["universal.sendTime"] =
      typeof prefs.send_time === "string" && HHMM_RE.test(prefs.send_time)
        ? prefs.send_time
        : DEFAULT_SEND_TIME;
  }
  if (values["universal.timezone"] == null) {
    values["universal.timezone"] =
      typeof prefs.timezone === "string" && prefs.timezone.trim()
        ? prefs.timezone.trim()
        : DEFAULT_TIMEZONE;
  }
  if (name) values["universal.name"] = name;

  return {
    selectedCategories: coerceCategories(prefs.focus_categories),
    values,
  };
}
