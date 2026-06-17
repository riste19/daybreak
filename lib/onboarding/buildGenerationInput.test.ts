import { describe, it, expect } from "vitest";

import { buildGenerationInput } from "./buildGenerationInput";
import type { AnswerSet } from "./resolveAnswers";

/** Minimal valid answer set: one category + the required goal. */
function base(partial: Partial<AnswerSet> = {}): AnswerSet {
  return {
    selectedCategories: partial.selectedCategories ?? ["work"],
    values: {
      "universal.goal": "Ship my side project",
      ...partial.values,
    },
  };
}

describe("buildGenerationInput — discrete fields", () => {
  it("maps goal → primaryGoal and tone from resolveAnswers", () => {
    const input = buildGenerationInput(
      base({ values: { "universal.goal": "Stay on track", "universal.tone": "direct" } }),
    );
    expect(input.primaryGoal).toBe("Stay on track");
    expect(input.tone).toBe("direct");
  });

  it("carries intensity and weighted focusAreas through to the engine input", () => {
    const input = buildGenerationInput(
      base({
        selectedCategories: ["mood", "fitness"],
        values: {
          "universal.goal": "Be steady",
          "mood.help": "encouragement",
          "mood.directness": "direct",
          "fitness.goal": "strength",
        },
      }),
    );
    expect(input.intensity).toBe("direct");
    expect(input.focusAreas.map((f) => f.id).sort()).toEqual(["fitness", "mood"]);
    // Weighted + sorted most → least.
    expect(input.focusAreas[0].weight).toBeGreaterThanOrEqual(input.focusAreas[1].weight);
  });

  it("uses universal.name when present, trimmed", () => {
    const input = buildGenerationInput(base({ values: { "universal.name": "  Alex  " } }));
    expect(input.name).toBe("Alex");
  });

  it("falls back to 'friend' when no name is given", () => {
    const input = buildGenerationInput(base());
    expect(input.name).toBe("friend");
  });

  it("maps the note → customNotes and omits it when empty", () => {
    const withNote = buildGenerationInput(
      base({ values: { "universal.note": "Going through a busy season" } }),
    );
    expect(withNote.customNotes).toBe("Going through a busy season");

    const withoutNote = buildGenerationInput(base());
    expect(withoutNote.customNotes).toBeUndefined();
  });

  it("always sends an empty recentThemes (stateless engine)", () => {
    expect(buildGenerationInput(base()).recentThemes).toEqual([]);
  });
});

describe("buildGenerationInput — contextLines de-duplication", () => {
  it("keeps personalization lines but drops name/goal/note duplicates", () => {
    const input = buildGenerationInput(
      base({
        values: {
          "universal.name": "Alex",
          "universal.goal": "Ship the launch",
          "universal.note": "Be kind to myself this month",
          "work.focus": "growth", // → real personalization line we want to keep
        },
      }),
    );

    // The discrete-field restatements must not appear in contextLines.
    expect(input.contextLines.some((l) => l.startsWith("Their name is "))).toBe(false);
    expect(input.contextLines.some((l) => l.startsWith("Primary goal: "))).toBe(false);
    expect(input.contextLines).not.toContain("Be kind to myself this month");

    // A genuine personalization line still comes through.
    expect(input.contextLines.some((l) => /work focus/i.test(l))).toBe(true);
  });
});

describe("buildGenerationInput — preferredThemes", () => {
  it("carries resolved preferredThemes through unchanged", () => {
    const input = buildGenerationInput(
      base({
        selectedCategories: ["mood"],
        values: {
          "universal.goal": "Be kinder to myself",
          "mood.help": "celebration",
          "mood.recurring": "self_doubt",
        },
      }),
    );
    expect(input.preferredThemes.length).toBeGreaterThan(0);
    for (const t of input.preferredThemes) {
      expect(typeof t.theme).toBe("string");
      expect(typeof t.weight).toBe("number");
    }
  });
});
