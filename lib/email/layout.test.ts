import { describe, expect, it } from "vitest";

import {
  DEFAULT_AI_SLOT_ID,
  DEFAULT_LAYOUT,
  toOutputPlan,
  type EmailLayout,
} from "./layout";

describe("toOutputPlan", () => {
  it("derives a single default slot from the default layout", () => {
    const plan = toOutputPlan(DEFAULT_LAYOUT);
    expect(plan.slots).toEqual([DEFAULT_AI_SLOT_ID]);
    expect(plan.feed).toEqual([]);
  });

  it("lists AI slots in layout order and collects only feed text", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "chrome", role: "header" },
        { kind: "ai", id: "a1" },
        { kind: "text", id: "t1", text: "Drink water", handling: "verbatim" },
        { kind: "text", id: "t2", text: "call mom today", handling: "feed" },
        { kind: "ai", id: "a2" },
      ],
    };
    const plan = toOutputPlan(layout);
    expect(plan.slots).toEqual(["a1", "a2"]);
    // Verbatim text is excluded; only feed text reaches the model.
    expect(plan.feed).toEqual(["call mom today"]);
  });

  it("falls back to the default slot when the layout has no AI section", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [{ kind: "text", id: "t1", text: "Only static", handling: "verbatim" }],
    };
    expect(toOutputPlan(layout).slots).toEqual([DEFAULT_AI_SLOT_ID]);
  });

  it("ignores empty feed text", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "ai", id: "a1" },
        { kind: "text", id: "t1", text: "   ", handling: "feed" },
      ],
    };
    expect(toOutputPlan(layout).feed).toEqual([]);
  });
});
