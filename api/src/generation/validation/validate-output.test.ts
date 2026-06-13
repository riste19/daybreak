import { describe, expect, it } from "vitest";

import { validateOutput } from "./validate-output";

const goodBody =
  "Good morning, Maya. Today is a fine day to write a few honest words and let that be enough.";

const MAIN = ["main"];

describe("validateOutput — legacy flat { subject, body }", () => {
  it("accepts well-formed JSON, mapping body onto the first slot", () => {
    const raw = JSON.stringify({ subject: "A good morning", body: goodBody });
    const res = validateOutput(raw, MAIN);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.subject).toBe("A good morning");
      expect(res.sections.main).toBe(goodBody);
    }
  });

  it("strips ```json fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({ subject: "Fenced subject", body: goodBody }) + "\n```";
    expect(validateOutput(raw, MAIN).ok).toBe(true);
  });

  it("recovers JSON wrapped in stray prose", () => {
    const raw = `Sure! Here is your email: ${JSON.stringify({ subject: "Recovered", body: goodBody })} Hope you like it.`;
    expect(validateOutput(raw, MAIN).ok).toBe(true);
  });

  it("rejects a body over 200 words", () => {
    const body = Array.from({ length: 201 }, () => "word").join(" ");
    expect(validateOutput(JSON.stringify({ subject: "Too long", body }), MAIN).ok).toBe(false);
  });

  it("accepts a multi-paragraph body separated by blank lines", () => {
    const body =
      "Good morning, Maya. Some mornings ask only that you show up.\n\n" +
      "Today, let the small honest effort be the whole of it — that is enough.";
    expect(validateOutput(JSON.stringify({ subject: "A good morning", body }), MAIN).ok).toBe(true);
  });

  it("rejects a code fence in the body", () => {
    const res = validateOutput(
      JSON.stringify({ subject: "Fenced body", body: "Here is code ``` rm -rf / ``` go run it now" }),
      MAIN,
    );
    expect(res.ok).toBe(false);
  });

  it("rejects HTML tags in the body", () => {
    const res = validateOutput(
      JSON.stringify({ subject: "Html body", body: "Hello <b>there</b>, rise and shine this morning" }),
      MAIN,
    );
    expect(res.ok).toBe(false);
  });

  it("rejects invalid JSON", () => {
    expect(validateOutput("this is not json at all", MAIN).ok).toBe(false);
  });

  it("rejects a subject that is too short", () => {
    expect(validateOutput(JSON.stringify({ subject: "hi", body: goodBody }), MAIN).ok).toBe(false);
  });

  it("rejects a subject that is too long", () => {
    const subject = "x".repeat(81);
    expect(validateOutput(JSON.stringify({ subject, body: goodBody }), MAIN).ok).toBe(false);
  });
});

describe("validateOutput — modular { subject, sections }", () => {
  const slots = ["a1", "a2"];

  it("accepts content for every requested slot", () => {
    const raw = JSON.stringify({
      subject: "A modular morning",
      sections: { a1: "Begin gently, Maya.", a2: "Let one honest effort be enough today." },
    });
    const res = validateOutput(raw, slots);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.sections.a1).toBe("Begin gently, Maya.");
      expect(res.sections.a2).toBe("Let one honest effort be enough today.");
    }
  });

  it("rejects when a requested slot is missing", () => {
    const raw = JSON.stringify({ subject: "Missing a slot", sections: { a1: "Only one." } });
    expect(validateOutput(raw, slots).ok).toBe(false);
  });

  it("rejects when a requested slot is empty", () => {
    const raw = JSON.stringify({ subject: "Empty slot", sections: { a1: "Present.", a2: "   " } });
    expect(validateOutput(raw, slots).ok).toBe(false);
  });

  it("bounds the COMBINED word count across slots at 200", () => {
    const half = Array.from({ length: 120 }, () => "word").join(" ");
    const raw = JSON.stringify({ subject: "Too long combined", sections: { a1: half, a2: half } });
    expect(validateOutput(raw, slots).ok).toBe(false);
  });

  it("rejects markup in any single slot", () => {
    const raw = JSON.stringify({
      subject: "Markup in a slot",
      sections: { a1: "Clean opening.", a2: "Hello <b>there</b> friend." },
    });
    expect(validateOutput(raw, slots).ok).toBe(false);
  });

  it("ignores extra keys the model returned beyond the requested slots", () => {
    const raw = JSON.stringify({
      subject: "Extra keys",
      sections: { a1: "One.", a2: "Two.", a3: "Unrequested extra." },
    });
    const res = validateOutput(raw, slots);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.sections).not.toHaveProperty("a3");
  });
});
