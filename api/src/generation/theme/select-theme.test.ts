import { describe, expect, it } from "vitest";

import { selectTheme } from "./select-theme";
import { THEMES, type Theme } from "../domain/types";

const N = THEMES.length;

/** Recompute the pure calendar pick the way the implementation seeds it. */
function calendarTheme(date: Date): Theme {
  const dayIndex = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  return THEMES[((dayIndex % N) + N) % N];
}

describe("selectTheme", () => {
  it("is deterministic for a fixed date with empty recent themes", () => {
    const date = new Date("2026-06-10T08:00:00Z");
    const first = selectTheme(date, []);
    const second = selectTheme(date, []);
    expect(first).toBe(second);
    expect(first).toBe(calendarTheme(date)); // pure calendar pick when nothing is recent
  });

  it("ignores the time of day (same calendar date → same theme)", () => {
    const morning = selectTheme(new Date("2026-06-10T06:00:00Z"), []);
    const evening = selectTheme(new Date("2026-06-10T23:30:00Z"), []);
    expect(morning).toBe(evening);
  });

  it("never returns a theme inside the recent window", () => {
    for (let offset = 0; offset < 60; offset++) {
      const date = new Date(Date.UTC(2026, 0, 1 + offset));
      const recent: Theme[] = [calendarTheme(date), THEMES[0], THEMES[3]];
      const picked = selectTheme(date, recent);
      expect(recent).not.toContain(picked);
    }
  });

  it("does not let preference override a free calendar pick", () => {
    const date = new Date("2026-06-10T00:00:00Z");
    const seed = calendarTheme(date);
    const other = THEMES.find((t) => t !== seed)!;
    // Strong preference for another theme, but the calendar theme is available.
    const picked = selectTheme(date, [], [{ theme: other, weight: 99 }]);
    expect(picked).toBe(seed); // calendar is primary
  });

  it("uses preferredThemes as the tiebreak when the calendar theme is recent", () => {
    const date = new Date("2026-06-10T00:00:00Z");
    const seed = calendarTheme(date);
    const target = THEMES.find((t) => t !== seed)!;
    // Force a collision on the calendar pick so preference decides the replacement.
    const picked = selectTheme(date, [seed], [{ theme: target, weight: 10 }]);
    expect(picked).toBe(target);
  });

  it("falls back to the least-recently-used theme when all are recent", () => {
    const date = new Date("2026-06-10T00:00:00Z");
    const recent = [...THEMES]; // most-recent-first; last entry is least-recently-used
    const picked = selectTheme(date, recent);
    expect(picked).toBe(recent[recent.length - 1]);
  });
});
