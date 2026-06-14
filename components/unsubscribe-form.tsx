"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/validation";

export function UnsubscribeForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className="text-lg leading-relaxed text-ink-soft">
        You&apos;re unsubscribed — no more daily emails will arrive. Take care of
        your mornings. 🌙
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Your email address"
          required
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong — check the email and try again.
        </p>
      )}
    </form>
  );
}
