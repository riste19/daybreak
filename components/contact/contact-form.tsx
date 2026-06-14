"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, Loader2, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/app/contact/actions";
import { initialContactState } from "@/app/contact/contact-state";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialContactState,
  );

  if (state.status === "success") {
    return (
      <div className="animate-reveal rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-medium text-ink">
          Message sent
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">{state.message}</p>
        <div className="mt-7">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : null;

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {state.status === "error" && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-5">
        <Field id="name" label="Your name" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Maya Sterling"
            defaultValue={values?.name}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

        <Field
          id="email"
          label="Email"
          error={errors.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={values?.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>

        <Field
          id="subject"
          label="Subject"
          hint="Optional"
          error={errors.subject}
        >
          <Input
            id="subject"
            name="subject"
            placeholder="What's this about?"
            defaultValue={values?.subject}
          />
        </Field>

        <Field
          id="message"
          label="Message"
          error={errors.message}
        >
          <Textarea
            id="message"
            name="message"
            rows={6}
            maxLength={2000}
            placeholder="Tell us what's on your mind…"
            defaultValue={values?.message}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
          />
        </Field>
      </div>

      <div className="mt-7 flex items-center justify-end">
        <Button type="submit" size="lg" variant="glow" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden />
              Send message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/** One labelled field row with an optional hint and inline error. */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-ink">
          {label}
        </Label>
        {hint && <span className="text-xs text-ink-soft">{hint}</span>}
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className={cn("text-sm text-destructive")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
