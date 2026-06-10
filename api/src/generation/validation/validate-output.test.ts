import { describe, expect, it } from "vitest";

import { validateOutput } from "./validate-output";

const goodBody =
  "Good morning, Maya. Today is a fine day to write a few honest words and let that be enough.";

describe("validateOutput", () => {
  it("accepts well-formed JSON", () => {
    const raw = JSON.stringify({ subject: "A good morning", body: goodBody });
    const res = validateOutput(raw);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.subject).toBe("A good morning");
      expect(res.body).toBe(goodBody);
    }
  });

  it("strips ```json fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({ subject: "Fenced subject", body: goodBody }) + "\n```";
    const res = validateOutput(raw);
    expect(res.ok).toBe(true);
  });

  it("recovers JSON wrapped in stray prose", () => {
    const raw = `Sure! Here is your email: ${JSON.stringify({ subject: "Recovered", body: goodBody })} Hope you like it.`;
    const res = validateOutput(raw);
    expect(res.ok).toBe(true);
  });

  it("rejects a body over 200 words", () => {
    const body = Array.from({ length: 201 }, () => "word").join(" ");
    const res = validateOutput(JSON.stringify({ subject: "Too long", body }));
    expect(res.ok).toBe(false);
  });

  it("accepts a multi-paragraph body separated by blank lines", () => {
    const body =
      "Good morning, Maya. Some mornings ask only that you show up.\n\n" +
      "Today, let the small honest effort be the whole of it — that is enough.";
    const res = validateOutput(JSON.stringify({ subject: "A good morning", body }));
    expect(res.ok).toBe(true);
  });

  it("rejects a code fence in the body", () => {
    const res = validateOutput(
      JSON.stringify({ subject: "Fenced body", body: "Here is code ``` rm -rf / ``` go run it now" }),
    );
    expect(res.ok).toBe(false);
  });

  it("rejects HTML tags in the body", () => {
    const res = validateOutput(
      JSON.stringify({ subject: "Html body", body: "Hello <b>there</b>, rise and shine this morning" }),
    );
    expect(res.ok).toBe(false);
  });

  it("rejects invalid JSON", () => {
    expect(validateOutput("this is not json at all").ok).toBe(false);
  });

  it("rejects a subject that is too short", () => {
    expect(validateOutput(JSON.stringify({ subject: "hi", body: goodBody })).ok).toBe(false);
  });

  it("rejects a subject that is too long", () => {
    const subject = "x".repeat(81);
    expect(validateOutput(JSON.stringify({ subject, body: goodBody })).ok).toBe(false);
  });
});
