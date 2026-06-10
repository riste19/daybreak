"use client";

import * as React from "react";
import { ArrowLeft, Check, Copy, Send, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  GenerationInput,
  GenerationResult,
} from "@/lib/onboarding/buildGenerationInput";

interface DebugReviewProps {
  /** The exact request body that will be POSTed to /api/generate. */
  input: GenerationInput;
  /** Return to the questionnaire to change answers. */
  onBackToEdit: () => void;
}

type Phase = "preview" | "sending" | "done";

interface SendOutcome {
  status: number;
  ok: boolean;
  /** Parsed response JSON — a GenerationResult on success, or an error shape. */
  data: unknown;
}

/** Narrow an unknown response to the engine's success shape for nicer rendering. */
function asGenerationResult(data: unknown): GenerationResult | null {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.subject === "string" && typeof d.body === "string") {
      return d as unknown as GenerationResult;
    }
  }
  return null;
}

/**
 * Dev-phase debug window. Shows the exact JSON we'd send to the generation
 * engine, waits for explicit confirmation, then sends it and renders the raw
 * response — so the wiring can be inspected end to end before it's productized.
 */
export function DebugReview({ input, onBackToEdit }: DebugReviewProps) {
  const [phase, setPhase] = React.useState<Phase>("preview");
  const [outcome, setOutcome] = React.useState<SendOutcome | null>(null);
  const [copied, setCopied] = React.useState(false);

  const requestJson = React.useMemo(() => JSON.stringify(input, null, 2), [input]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(requestJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — silently ignore. */
    }
  };

  const send = async () => {
    setPhase("sending");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res
        .json()
        .catch(() => ({ error: "Response body was not valid JSON." }));
      setOutcome({ status: res.status, ok: res.ok, data });
    } catch (err) {
      setOutcome({
        status: 0,
        ok: false,
        data: { error: "Network request failed.", detail: String(err) },
      });
    } finally {
      setPhase("done");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center gap-2">
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft">
          Debug
        </span>
        <h2 className="font-display text-2xl font-medium text-ink">
          Review what we&apos;ll send
        </h2>
      </header>

      {/* ── Request preview (always visible) ── */}
      <Panel
        title="Request body → POST /api/generate"
        subtitle="This is the exact JSON sent to the generation engine."
      >
        <JsonBlock json={requestJson} />
        <button
          type="button"
          onClick={copyJson}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </Panel>

      {phase !== "done" ? (
        <>
          <p className="mt-5 text-center text-sm text-ink-soft">
            Nothing is sent until you confirm.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={onBackToEdit} disabled={phase === "sending"}>
              <ArrowLeft className="size-4" />
              Back to edit
            </Button>
            <Button variant="glow" onClick={send} disabled={phase === "sending"}>
              <Send className="size-4" />
              {phase === "sending" ? "Sending…" : "Send to the agent"}
            </Button>
          </div>
        </>
      ) : (
        outcome && <ResultView outcome={outcome} onSendAgain={send} onBackToEdit={onBackToEdit} />
      )}
    </div>
  );
}

/* ─────────────────────────────── Result ─────────────────────────────────── */

function ResultView({
  outcome,
  onSendAgain,
  onBackToEdit,
}: {
  outcome: SendOutcome;
  onSendAgain: () => void;
  onBackToEdit: () => void;
}) {
  const result = outcome.ok ? asGenerationResult(outcome.data) : null;
  const responseJson = JSON.stringify(outcome.data, null, 2);

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge ok={outcome.ok} status={outcome.status} />
        {result?.usedFallback && (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-ink-soft">
            <TriangleAlert className="size-3.5" />
            fallback email
          </span>
        )}
        {result && (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-ink-soft">
            theme: {result.theme}
          </span>
        )}
      </div>

      {/* Rendered email when the engine succeeded. */}
      {result && (
        <Panel title="Rendered email">
          <div className="text-sm font-medium text-ink">{result.subject}</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {result.body}
          </p>
        </Panel>
      )}

      {/* Raw response, always shown — this is the debug payload. */}
      <Panel
        className="mt-4"
        title="Raw response"
        subtitle={outcome.ok ? undefined : "Engine returned an error — body below."}
      >
        <JsonBlock json={responseJson} tone={outcome.ok ? "default" : "error"} />
      </Panel>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBackToEdit}>
          <ArrowLeft className="size-4" />
          Back to edit
        </Button>
        <Button variant="outline" onClick={onSendAgain}>
          <Send className="size-4" />
          Send again
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Pieces ─────────────────────────────────── */

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-2">
        <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-soft">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function JsonBlock({ json, tone = "default" }: { json: string; tone?: "default" | "error" }) {
  return (
    <pre
      className={cn(
        "max-h-80 overflow-auto rounded-lg bg-secondary p-3 font-mono text-xs leading-relaxed text-ink",
        tone === "error" && "text-destructive",
      )}
    >
      {json}
    </pre>
  );
}

function StatusBadge({ ok, status }: { ok: boolean; status: number }) {
  const label = status === 0 ? "network error" : `HTTP ${status}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        ok ? "bg-secondary text-ink" : "bg-destructive/10 text-destructive",
      )}
    >
      {ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
      {label}
    </span>
  );
}
