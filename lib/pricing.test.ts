import { describe, expect, it } from "vitest";

import {
  annualSavings,
  annualTotal,
  getPlan,
  plans,
  type Plan,
} from "./pricing";

const free = getPlan("free_trial")!;
const daily = getPlan("daily")!;

describe("pricing plans", () => {
  it("exposes the free and paid plans by stable id", () => {
    expect(free).toBeDefined();
    expect(daily).toBeDefined();
    expect(getPlan("does-not-exist")).toBeUndefined();
  });

  it("has exactly one featured plan — the one checkout will accept", () => {
    // createSubscriberAccount only provisions when `plan.featured` is true, so
    // there must be exactly one such plan and it must be the paid one.
    const featured = plans.filter((p: Plan) => p.featured);
    expect(featured).toHaveLength(1);
    expect(featured[0].id).toBe("daily");
  });

  it("prices the free plan at zero with no annual savings", () => {
    expect(free.price.monthly).toBe(0);
    expect(free.price.annual).toBe(0);
    expect(annualTotal(free)).toBe(0);
    expect(annualSavings(free)).toBe(0);
    expect(free.featured ?? false).toBe(false);
  });

  it("makes the annual paid plan cheaper than 12 monthly payments", () => {
    expect(annualTotal(daily)).toBe(daily.price.annual * 12);
    expect(annualSavings(daily)).toBe(daily.price.monthly * 12 - daily.price.annual * 12);
    expect(annualSavings(daily)).toBeGreaterThan(0);
  });

  it("gives the paid plan the headline premium features", () => {
    const highlights = daily.features.filter((f) => f.highlight);
    expect(highlights.length).toBeGreaterThanOrEqual(3);
    // The daily cadence and exact-time controls are the core upsell.
    const labels = daily.features.map((f) => f.label.toLowerCase()).join(" | ");
    expect(labels).toContain("every day");
    expect(labels).toContain("exact time");
  });
});
