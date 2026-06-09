"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NOTE_MAX_LENGTH } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

interface WaitlistFormProps {
  /** Unique prefix so ids don't collide when the form appears twice on a page. */
  idPrefix: string;
  /** Adapt text colours for placement on the dark dawn background. */
  tone?: "onDark" | "onLight";
  /** Optionally analytics-fire on success (wired up in Prompt 2). */
  onSuccess?: () => void;
  className?: string;
}

export function WaitlistForm({
  idPrefix,
  tone = "onDark",
  onSuccess,
  className,
}: WaitlistFormProps) {
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");
  const [company, setCompany] = React.useState(""); // honeypot
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState("");

  const onDark = tone === "onDark";
  const emailId = `${idPrefix}-email`;
  const noteId = `${idPrefix}-note`;
  const errorId = `${idPrefix}-error`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    // Cheap client-side guard so we don't bounce a request for an empty field.
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note, company }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; error?: string };

      if (res.ok && data.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're on the list.");
        onSuccess?.();
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-start gap-3 rounded-xl border px-5 py-4 text-left",
          onDark
            ? "border-gold/30 bg-white/5 text-cream"
            : "border-primary/20 bg-secondary text-ink",
          className,
        )}
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
        <div>
          <p className="font-medium">{message}</p>
          <p className={cn("text-sm", onDark ? "text-cream/70" : "text-ink-soft")}>
            Keep an eye on your inbox — your first light is coming.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
      {/* Honeypot — hidden from humans, ignored by them, often filled by bots. */}
      <div aria-hidden className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${idPrefix}-company`}>Company (leave blank)</label>
        <input
          id={`${idPrefix}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor={emailId} className="sr-only">
            Email address
          </Label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? errorId : undefined}
            disabled={status === "submitting"}
          />
        </div>
        <Button
          type="submit"
          variant="glow"
          size="lg"
          disabled={status === "submitting"}
          className="shrink-0"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Joining…
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
      </div>

      <div className="mt-3">
        <Label
          htmlFor={noteId}
          className={cn("mb-1 block text-xs font-normal", onDark ? "text-cream/60" : "text-ink-soft")}
        >
          What are you working on?{" "}
          <span className={onDark ? "text-cream/40" : "text-ink-soft/70"}>(optional)</span>
        </Label>
        <Input
          id={noteId}
          type="text"
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Writing a novel, training for a 10k, staying sober…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={status === "submitting"}
        />
      </div>

      {status === "error" && (
        <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-gold">
          {message}
        </p>
      )}

      <p className={cn("mt-3 text-xs", onDark ? "text-cream/55" : "text-ink-soft")}>
        No spam. One email a day, only once we launch. Leave anytime.
      </p>
    </form>
  );
}
