import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeliveryService } from "./delivery.service";
import type { SendDailyInput } from "./domain/types";
import type { EmailClient, OutgoingEmail } from "./email/email-client";
import type { GenerationService } from "../generation/generation.service";
import type { GenerationInput, GenerationResult } from "../generation/domain/types";

const GENERATION_RESULT: GenerationResult = {
  subject: "Begin where you are",
  body: "Morning, Maya.\n\nStart small today.",
  theme: "momentum",
  usedFallback: false,
};

function makeInput(overrides: Partial<SendDailyInput> = {}): SendDailyInput {
  return {
    to: "maya@example.com",
    name: "Maya",
    primaryGoal: "Finish the first draft of my novel",
    tone: "gentle",
    contextLines: [],
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
    service = new DeliveryService(fakeGeneration, fakeEmail);
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
