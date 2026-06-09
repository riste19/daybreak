import { THEMES, type PreferredTheme, type Theme } from "../domain/types";

/**
 * Deterministic daily theme selection.
 *
 * Strategy (per product decision: "calendar + recency, preference as tiebreak"):
 *  1. The calendar picks one theme-of-the-day, deterministic by UTC calendar date.
 *     If that theme is NOT in the recent window, it wins outright — the calendar
 *     is primary, so onboarding preference never overrides a free calendar pick.
 *  2. If the calendar theme collides with a recent one, choose among the themes
 *     not used recently. Here preferredThemes (onboarding affinity) is the
 *     tiebreak; calendar rotation rank keeps it deterministic when preferences
 *     are equal or absent.
 *  3. If every theme is recent, fall back to the least-recently-used one.
 *
 * `recentThemes` is ordered MOST-RECENT-FIRST (index 0 = yesterday).
 */
export function selectTheme(
  date: Date,
  recentThemes: Theme[] = [],
  preferredThemes: PreferredTheme[] = [],
): Theme {
  const n = THEMES.length;
  const seed = ((dayIndex(date) % n) + n) % n;
  const recent = new Set(recentThemes);

  // 1. Calendar theme-of-the-day.
  const calendarTheme = THEMES[seed];
  if (!recent.has(calendarTheme)) return calendarTheme;

  // 2. Collision — pick a replacement, preference-first then calendar rank.
  const available = THEMES.filter((t) => !recent.has(t));
  if (available.length > 0) {
    return [...available].sort((a, b) => {
      const pref = weightOf(b, preferredThemes) - weightOf(a, preferredThemes);
      if (pref !== 0) return pref;
      return rotationRank(a, seed, n) - rotationRank(b, seed, n);
    })[0];
  }

  // 3. Everything is recent — least-recently-used (largest index = used longest ago).
  return [...THEMES].sort((a, b) => {
    const lru = recentThemes.indexOf(b) - recentThemes.indexOf(a);
    if (lru !== 0) return lru;
    return rotationRank(a, seed, n) - rotationRank(b, seed, n);
  })[0];
}

/** Whole-day index in UTC — stable per calendar date, independent of time of day. */
function dayIndex(date: Date): number {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor(utcMidnight / 86_400_000);
}

/** Distance from today's seed in the fixed THEMES rotation (0 = seed theme). */
function rotationRank(theme: Theme, seed: number, n: number): number {
  return (THEMES.indexOf(theme) - seed + n) % n;
}

function weightOf(theme: Theme, preferred: PreferredTheme[]): number {
  let total = 0;
  for (const p of preferred) if (p.theme === theme) total += p.weight;
  return total;
}
