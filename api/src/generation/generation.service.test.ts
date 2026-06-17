import { describe, expect, it, vi } from "vitest";

import { GenerationService, MAX_ATTEMPTS } from "./generation.service";
import type { LlmClient } from "./llm/llm-client";
import type { GenerationInput } from "./domain/types";
import { FALLBACK_BANK } from "./fallback/fallback-bank";

const FIXED_NOW = new Date("2026-06-10T00:00:00Z");

function input(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return {
    name: "Maya",
    primaryGoal: "Finish the first draft",
    tone: "gentle",
    intensity: "balanced",
    customNotes: undefined,
    contextLines: [],
    focusAreas: [],
    preferredThemes: [],
    recentThemes: [],
    ...overrides,
  };
}

describe("GenerationService", () => {
  it("returns a fallback only after MAX_ATTEMPTS failed attempts", async () => {
    const llm: LlmClient = { generateEmailJson: vi.fn().mockResolvedValue("not valid json") };
    const service = new GenerationService(llm);

    const result = await service.generate(input(), FIXED_NOW);

    expect(llm.generateEmailJson).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(result.usedFallback).toBe(true);
    expect(FALLBACK_BANK.map((m) => m.body)).toContain(result.body);
  });

  it("returns generated content when the model succeeds", async () => {
    const valid = JSON.stringify({
      subject: "Your morning, Maya",
      body: "Rise gently and write a few honest words today; that alone is plenty.",
    });
    const llm: LlmClient = { generateEmailJson: vi.fn().mockResolvedValue(valid) };
    const service = new GenerationService(llm);

    const result = await service.generate(input(), FIXED_NOW);

    expect(llm.generateEmailJson).toHaveBeenCalledTimes(1);
    expect(result.usedFallback).toBe(false);
    expect(result.subject).toBe("Your morning, Maya");
  });

  it("retries once after a thrown error, then succeeds", async () => {
    const valid = JSON.stringify({
      subject: "Second try wins",
      body: "A steady start beats a perfect one; begin where you are this morning.",
    });
    const generateEmailJson = vi
      .fn()
      .mockRejectedValueOnce(new Error("gemini 500"))
      .mockResolvedValueOnce(valid);
    const service = new GenerationService({ generateEmailJson });

    const result = await service.generate(input(), FIXED_NOW);

    expect(generateEmailJson).toHaveBeenCalledTimes(2);
    expect(result.usedFallback).toBe(false);
  });

  it("falls back without calling the model when moderation blocks the input", async () => {
    const llm: LlmClient = { generateEmailJson: vi.fn() };
    const service = new GenerationService(llm);

    const result = await service.generate(input({ primaryGoal: "i want to die" }), FIXED_NOW);

    expect(llm.generateEmailJson).not.toHaveBeenCalled();
    expect(result.usedFallback).toBe(true);
  });
});
