import { describe, expect, it, vi } from "vitest";

import { FallbackLlmClient } from "./fallback-llm-client";
import type { LlmClient } from "./llm-client";

const prompt = { system: "sys", user: "usr" };

function provider(name: string, impl: LlmClient["generateEmailJson"]): LlmClient {
  return { name, generateEmailJson: impl };
}

describe("FallbackLlmClient", () => {
  it("returns the first provider's result without calling later ones", async () => {
    const second = vi.fn();
    const chain = new FallbackLlmClient([
      provider("a", vi.fn().mockResolvedValue("ok")),
      provider("b", second),
    ]);

    await expect(chain.generateEmailJson(prompt)).resolves.toBe("ok");
    expect(second).not.toHaveBeenCalled();
  });

  it("fails over to the next provider when the first throws (e.g. out of quota)", async () => {
    const chain = new FallbackLlmClient([
      provider("gemini", vi.fn().mockRejectedValue(new Error("429 quota exceeded"))),
      provider("anthropic", vi.fn().mockResolvedValue("from-haiku")),
    ]);

    await expect(chain.generateEmailJson(prompt)).resolves.toBe("from-haiku");
  });

  it("throws with all provider errors when every provider fails", async () => {
    const chain = new FallbackLlmClient([
      provider("gemini", vi.fn().mockRejectedValue(new Error("boom-1"))),
      provider("anthropic", vi.fn().mockRejectedValue(new Error("boom-2"))),
    ]);

    await expect(chain.generateEmailJson(prompt)).rejects.toThrow(/boom-1.*boom-2/);
  });

  it("passes options through to the provider", async () => {
    const gen = vi.fn().mockResolvedValue("ok");
    const chain = new FallbackLlmClient([provider("a", gen)]);

    await chain.generateEmailJson(prompt, { temperature: 0.5 });

    expect(gen).toHaveBeenCalledWith(prompt, { temperature: 0.5 });
  });

  it("rejects an empty provider list", () => {
    expect(() => new FallbackLlmClient([])).toThrow();
  });
});
