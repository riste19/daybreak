"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "@/app/login/actions";
import { initialLoginState } from "@/app/login/login-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialLoginState);

  if (state.status === "sent") {
    return (
      <div className="animate-reveal rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-medium text-ink">Check your inbox</h2>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">
          If <span className="font-medium text-ink">{state.email}</span> has a Daybreak
          account, a sign-in link is on its way. Open it on this device to come straight in.
        </p>
        {state.demo && (
          <p className="mx-auto mt-4 max-w-sm rounded-lg bg-secondary px-3 py-2 text-xs text-ink-soft">
            Demo mode: Supabase isn&apos;t configured, so no email was actually sent.
          </p>
        )}
        <p className="mt-6 text-sm text-ink-soft">
          Didn&apos;t get it?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Try again
          </Link>
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : null;
  const emailValue = state.status === "error" ? state.email : undefined;

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-ink">
          Email address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={emailValue}
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error && (
          <p id="email-error" className={cn("text-sm text-destructive")}>
            {error}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" variant="glow" className="mt-6 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Email me a sign-in link
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-ink-soft">
        No password needed — we&apos;ll email you a secure one-time link.
      </p>
    </form>
  );
}
