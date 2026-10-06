"use client";

import * as React from "react";
import { ArrowLeft, Check, Mail, TriangleAlert } from "lucide-react";
import { usePostHog } from "@/components/analytics/posthog-context";

import { Button } from "@/components/ui/button";
import { toOutputPlan, type EmailLayout } from "@/lib/email/layout";
import type { GenerationInput } from "@/lib/onboarding/buildGenerationInput";
import { wakeEngine } from "@/lib/wake-engine";

interface ReviewSendProps {
  /** The request body built from onboarding answers. */
  input: GenerationInput;
  /** The chosen email layout, rendered verbatim by the engine. */
  emailLayout: EmailLayout;
  /** Recipient address from onboarding. */
  to: string;
  /** Return to the customize screen. */
  onBackToEdit: () => void;
}

type Phase = "idle" | "sending" | "sent" | "error";

// The button's in-flight label, escalating with time. A send usually takes a
// few seconds, but up to a minute when the engine is waking from sleep.
const SENDING_LABELS = ["Writing your email…", "Still writing…", "Almost there…"];
const SLOW_AFTER_MS = [8_000, 25_000];

/**
 * The product (non-owner) review screen. A calm confirm-then-send: it delivers
 * the sample email via /api/send and shows a friendly result — no prompt editor,
 * request JSON, or raw response (that lives in the owner-only DebugReview).
 */
export function ReviewSend({ input, emailLayout, to, onBackToEdit }: ReviewSendProps) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [slowness, setSlowness] = React.useState(0);
  const posthog = usePostHog();

  // Re-wake on arrival, in case the visitor lingered on the earlier screens
  // long enough for the engine to fall back asleep.
  React.useEffect(() => {
    wakeEngine();
  }, []);

  React.useEffect(() => {
    if (phase !== "sending") return;
    const timers = SLOW_AFTER_MS.map((ms, i) => setTimeout(() => setSlowness(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const send = async () => {
    setSlowness(0);
    setPhase("sending");
    // Same deliver body as the debug screen, minus any systemPromptOverride —
    // the engine uses its default prompt and generates a fresh email.
    const body = {
      ...input,
      outputPlan: toOutputPlan(emailLayout),
      to,
      emailLayout,
    };

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const data = (await res.json().catch(() => null)) as { theme?: string } | null;
      posthog?.capture("email_sent", { theme: data?.theme });
      setPhase("sent");
    } catch {
      setPhase("error");
    }
  };

  if (phase === "sent") {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </div>
        <h2 className="font-display text-2xl font-medium text-ink">
          Sent — check your inbox
        </h2>
        <p className="mt-3 text-ink-soft">
          Your sample morning email is on its way to{" "}
          <span className="font-medium text-ink">{to}</span>.
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Didn&apos;t get it in a minute or two? Have a peek in your spam folder.
        </p>
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={onBackToEdit}>
            <ArrowLeft className="size-4" />
            Back to edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 className="font-display text-2xl font-medium text-ink">
        Review what we&apos;ll send
      </h2>
      <p className="mt-3 text-ink-soft">
        We&apos;ll send your sample morning email to{" "}
        <span className="font-medium text-ink">{to}</span>.
      </p>

      {phase === "error" && (
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
          <TriangleAlert className="size-4" />
          Something went wrong. Please try again.
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button
          size="lg"
          variant="glow"
          onClick={send}
          disabled={phase === "sending"}
        >
          <Mail className="size-4" />
          {phase === "sending" ? SENDING_LABELS[slowness] : `Email it to ${to}`}
        </Button>
        {phase === "sending" && slowness > 0 && (
          <p className="text-sm text-ink-soft" role="status">
            The first email after a quiet spell can take up to a minute.
          </p>
        )}
        <Button variant="ghost" onClick={onBackToEdit} disabled={phase === "sending"}>
          <ArrowLeft className="size-4" />
          Back to edit
        </Button>
      </div>
    </div>
  );
}
