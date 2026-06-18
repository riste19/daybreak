"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toOutputPlan, type EmailLayout } from "@/lib/email/layout";
import type {
  GenerationInput,
  GenerationResult,
} from "@/lib/onboarding/buildGenerationInput";
import { EmailBuilder } from "./email-builder";
import { EmailPreview } from "./email-preview";

/**
 * "Customize your email" — arrange the email's sections (left) with a live
 * preview (right). "Preview with AI" runs a real generation through
 * /api/generate so the AI slots fill with actual copy; until then they show
 * placeholders. The arranged layout is lifted up via onChange.
 */

interface CustomizeScreenProps {
  input: GenerationInput;
  layout: EmailLayout;
  onChange: (layout: EmailLayout) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface PreviewState {
  subject: string;
  sections: Record<string, string>;
  theme: string;
}

export function CustomizeScreen({
  input,
  layout,
  onChange,
  onBack,
  onContinue,
}: CustomizeScreenProps) {
  const [preview, setPreview] = React.useState<PreviewState | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, outputPlan: toOutputPlan(layout) }),
      });
      const data = (await res.json().catch(() => null)) as GenerationResult | null;
      if (!res.ok || !data || typeof data.subject !== "string") {
        setError("Couldn't generate a preview. Is the engine running?");
        return;
      }
      setPreview({
        subject: data.subject,
        sections: data.sections ?? {},
        theme: data.theme,
      });
    } catch {
      setError("Network error reaching the generation engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h2 className="font-display text-2xl font-medium text-ink">Customize your email</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Drag to reorder, and add your own text blocks. They show in the email
          exactly as you type them. The AI message is written fresh each morning;
          click &ldquo;Preview with AI&rdquo; to see it.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h3 className="mb-3 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft">
            Sections
          </h3>
          <EmailBuilder layout={layout} onChange={onChange} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-soft">
              Preview
            </h3>
            <Button variant="outline" size="sm" onClick={runPreview} disabled={loading}>
              <Sparkles className="size-4" />
              {loading ? "Generating…" : preview ? "Regenerate" : "Preview with AI"}
            </Button>
          </div>
          {error && (
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-destructive">
              <TriangleAlert className="size-3.5" />
              {error}
            </p>
          )}
          <div className="sticky top-4">
            <EmailPreview
              layout={layout}
              sections={preview?.sections ?? {}}
              subject={preview?.subject ?? ""}
              tone={input.tone}
              theme={preview?.theme ?? "momentum"}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to questions
        </Button>
        <Button variant="glow" onClick={onContinue}>
          Review &amp; send
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
