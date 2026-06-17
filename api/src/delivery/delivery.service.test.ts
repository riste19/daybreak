import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeliveryService } from "./delivery.service";
import type { SendDailyInput } from "./domain/types";
import type { EmailClient, OutgoingEmail } from "./email/email-client";
import type { GenerationService } from "../generation/generation.service";
import type { AppConfigService } from "../config/app-config.service";
import type { GenerationInput, GenerationResult } from "../generation/domain/types";

const GENERATION_RESULT: GenerationResult = {
  subject: "Begin where you are",
  body: "Morning, Maya.\n\nStart small today.",
  sections: { main: "Morning, Maya.\n\nStart small today." },
  theme: "momentum",
  usedFallback: false,
};

function makeInput(overrides: Partial<SendDailyInput> = {}): SendDailyInput {
  return {
    to: "maya@example.com",
    name: "Maya",
    primaryGoal: "Finish the first draft of my novel",
    tone: "gentle",
    intensity: "balanced",
    contextLines: [],
    focusAreas: [],
    preferredThemes: [],
    recentThemes: [],
    ...overrides,
  };
}

describe("DeliveryService.sendDaily", () => {
  let generate: ReturnType<typeof vi.fn>;
  let send: ReturnType<typeof vi.fn>;
  let service: DeliveryService;
  let sentEmails: OutgoingEmail[];

  beforeEach(() => {
    sentEmails = [];
    generate = vi.fn(async (_input: GenerationInput) => GENERATION_RESULT);
    send = vi.fn(async (email: OutgoingEmail) => {
      sentEmails.push(email);
      return { id: "msg_123" };
    });
    const fakeGeneration = { generate } as unknown as GenerationService;
    const fakeEmail: EmailClient = { provider: "fake", send };
    const fakeConfig = { appUrl: "https://test.example" } as unknown as AppConfigService;
    service = new DeliveryService(fakeGeneration, fakeEmail, fakeConfig);
  });

  it("generates, renders, and sends — returning the receipt", async () => {
    const result = await service.sendDaily(makeInput());

    expect(generate).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledOnce();
    expect(sentEmails[0].to).toBe("maya@example.com");
    expect(sentEmails[0].subject).toBe(GENERATION_RESULT.subject);
    expect(sentEmails[0].html).toContain("Start small today.");
    expect(sentEmails[0].text).toContain("Start small today.");

    expect(result).toEqual({
      to: "maya@example.com",
      subject: "Begin where you are",
      theme: "momentum",
      usedFallback: false,
      provider: "fake",
      messageId: "msg_123",
    });
  });

  it("keeps personalNote out of the generation input but in the rendered email", async () => {
    await service.sendDaily(
      makeInput({ personalNote: "Remember why you started." }),
    );

    const generationInput = generate.mock.calls[0][0] as Record<string, unknown>;
    expect(generationInput).not.toHaveProperty("personalNote");
    expect(generationInput).not.toHaveProperty("to");
    expect(JSON.stringify(generationInput)).not.toContain(
      "Remember why you started.",
    );

    expect(sentEmails[0].html).toContain("Remember why you started.");
    expect(sentEmails[0].text).toContain("Remember why you started.");
  });

  it("drops a personalNote that trips the distress screen", async () => {
    await service.sendDaily(
      makeInput({ personalNote: "some days I feel hopeless about all this" }),
    );

    expect(sentEmails[0].html).not.toContain("hopeless");
    expect(sentEmails[0].text).not.toContain("hopeless");
  });

  it("routes feed text to the model but keeps verbatim text out of it", async () => {
    await service.sendDaily(
      makeInput({
        emailLayout: {
          version: 1,
          sections: [
            { kind: "chrome", role: "header" },
            { kind: "chrome", role: "heading" },
            { kind: "text", id: "t1", text: "Drink water. Non-negotiable.", handling: "verbatim" },
            { kind: "ai", id: "main" },
            { kind: "text", id: "t2", text: "call mom today", handling: "feed" },
            { kind: "chrome", role: "footer" },
          ],
        },
      }),
    );

    const generationInput = generate.mock.calls[0][0] as {
      outputPlan?: { slots: string[]; feed: string[] };
    };
    // Feed text reaches the model; verbatim text never does.
    expect(generationInput.outputPlan?.slots).toEqual(["main"]);
    expect(generationInput.outputPlan?.feed).toEqual(["call mom today"]);
    expect(JSON.stringify(generationInput)).not.toContain("Drink water");

    // Verbatim text is rendered in the email; feed text is not its own block.
    expect(sentEmails[0].html).toContain("Drink water. Non-negotiable.");
    expect(sentEmails[0].html).not.toContain("call mom today");
  });

  it("sends a prepared message verbatim without regenerating", async () => {
    const result = await service.sendDaily(
      makeInput({
        message: {
          subject: "The previewed subject",
          body: "The exact previewed body.",
          theme: "reflection",
        },
      }),
    );

    expect(generate).not.toHaveBeenCalled();
    expect(sentEmails[0].subject).toBe("The previewed subject");
    expect(sentEmails[0].html).toContain("The exact previewed body.");
    expect(result.theme).toBe("reflection");
    expect(result.usedFallback).toBe(false);
  });

  it("propagates email-client failures to the caller", async () => {
    send.mockRejectedValueOnce(new Error("Resend send failed (401)"));
    await expect(service.sendDaily(makeInput())).rejects.toThrow(
      "Resend send failed",
    );
  });
});
