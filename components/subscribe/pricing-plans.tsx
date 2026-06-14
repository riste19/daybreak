"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check, Loader2, Lock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  annualSavings,
  annualTotal,
  CURRENCY,
  plans,
  type BillingPeriod,
  type Plan,
} from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSubscriberAccount,
  initialCheckoutState,
} from "@/app/subscribe/actions";

/**
 * The pricing surface: a monthly/annual toggle and the plan cards, rendered
 * straight from lib/pricing.ts. The free plan sends people into onboarding; the
 * paid plan opens an inline MOCK checkout (no payment, no account yet — see
 * app/subscribe/actions.ts). Swap the mock for real checkout later without
 * touching this layout.
 */
export function PricingPlans() {
  const [period, setPeriod] = React.useState<BillingPeriod>("annual");
  const [checkoutPlan, setCheckoutPlan] = React.useState<Plan | null>(null);
  const checkoutRef = React.useRef<HTMLDivElement>(null);

  const openCheckout = (plan: Plan) => {
    setCheckoutPlan(plan);
    requestAnimationFrame(() =>
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  return (
    <div>
      <BillingToggle period={period} onChange={setPeriod} />

      <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            onSubscribe={() => openCheckout(plan)}
          />
        ))}
      </div>

      {checkoutPlan && (
        <div ref={checkoutRef} className="mt-10">
          <MockCheckout
            plan={checkoutPlan}
            period={period}
            onClose={() => setCheckoutPlan(null)}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Billing toggle ───────────────────────────── */

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="group"
        aria-label="Billing period"
        className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm"
      >
        {(["monthly", "annual"] as const).map((value) => {
          const active = period === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {value === "monthly" ? "Monthly" : "Annual"}
            </button>
          );
        })}
      </div>
      <p className="inline-flex items-center gap-1.5 text-sm text-primary">
        <Sparkles className="size-3.5" aria-hidden />
        Save with annual — two months free.
      </p>
    </div>
  );
}

/* ─────────────────────────────── Plan card ──────────────────────────────── */

function PlanCard({
  plan,
  period,
  onSubscribe,
}: {
  plan: Plan;
  period: BillingPeriod;
  onSubscribe: () => void;
}) {
  const isFree = plan.price.monthly === 0 && plan.price.annual === 0;
  const perMonth = period === "annual" ? plan.price.annual : plan.price.monthly;
  const savings = annualSavings(plan);

  return (
    <section
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 sm:p-8",
        plan.featured
          ? "border-primary/40 shadow-[0_24px_60px_-28px_rgba(182,101,26,0.45)] ring-1 ring-primary/20"
          : "border-border shadow-sm",
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          <Sparkles className="size-3.5" aria-hidden />
          Most popular
        </span>
      )}

      <div>
        <h3 className="font-display text-2xl font-medium text-ink">{plan.name}</h3>
        <p className="mt-1.5 text-ink-soft">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mt-6">
        {isFree ? (
          <p className="font-display text-4xl font-medium text-ink">Free</p>
        ) : (
          <>
            <p className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-medium text-ink">
                {CURRENCY}
                {perMonth}
              </span>
              <span className="text-ink-soft">/ month</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {period === "annual" ? (
                <>
                  Billed {CURRENCY}
                  {annualTotal(plan)} a year
                  {savings > 0 && (
                    <span className="font-medium text-primary">
                      {" "}
                      · save {CURRENCY}
                      {savings}
                    </span>
                  )}
                </>
              ) : (
                "Billed monthly · cancel anytime"
              )}
            </p>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="mt-6">
        {isFree ? (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/start" transitionTypes={["nav-forward"]}>
              {plan.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button size="lg" variant="glow" className="w-full" onClick={onSubscribe}>
            {plan.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
        <p className="mt-3 text-center text-xs text-ink-soft">{plan.audience}</p>
      </div>

      {/* Features */}
      <ul className="mt-7 space-y-3 border-t border-border pt-7">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                feature.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary",
              )}
            >
              <Check className="size-3" aria-hidden />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "text-sm text-ink",
                  feature.highlight && "font-medium",
                )}
              >
                {feature.label}
              </span>
              {feature.detail && (
                <span className="mt-0.5 block text-sm text-ink-soft">
                  {feature.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────────────────── Mock checkout ────────────────────────────── */

function MockCheckout({
  plan,
  period,
  onClose,
}: {
  plan: Plan;
  period: BillingPeriod;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createSubscriberAccount,
    initialCheckoutState,
  );

  if (state.status === "success") {
    return (
      <div className="animate-reveal mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" aria-hidden />
        </span>
        <h3 className="mt-5 font-display text-2xl font-medium text-ink">
          You&apos;re on board
        </h3>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{state.message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="glow">
            <Link href="/start" transitionTypes={["nav-forward"]}>
              Set up your mornings
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Back to plans
          </Button>
        </div>
        <p className="mt-5 text-sm text-ink-soft">
          Manage it anytime —{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            sign in
          </Link>{" "}
          with your email.
        </p>
      </div>
    );
  }

  const perMonth = period === "annual" ? plan.price.annual : plan.price.monthly;
  const error = state.status === "error" ? state.message : null;
  const emailValue = state.status === "error" ? state.email : undefined;

  return (
    <form
      action={formAction}
      noValidate
      className="animate-reveal mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8"
    >
      <input type="hidden" name="planId" value={plan.id} />
      <input type="hidden" name="period" value={period} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Subscribing to
          </p>
          <h3 className="mt-1 font-display text-xl font-medium text-ink">
            {plan.name}
          </h3>
        </div>
        <p className="text-right text-sm text-ink-soft">
          <span className="font-display text-2xl font-medium text-ink">
            {CURRENCY}
            {perMonth}
          </span>
          <br />/ month, billed {period === "annual" ? "yearly" : "monthly"}
        </p>
      </div>

      <div className="mt-6 grid gap-2">
        <Label htmlFor="checkout-email" className="text-ink">
          Where should your mornings land?
        </Label>
        <Input
          id="checkout-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={emailValue}
          aria-invalid={!!error}
          aria-describedby={error ? "checkout-error" : undefined}
        />
        {error && (
          <p id="checkout-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" variant="glow" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Confirming…
            </>
          ) : (
            <>
              <Lock className="size-4" aria-hidden />
              Confirm subscription
            </>
          )}
        </Button>
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-soft">
        <Sparkles className="size-3.5 text-primary" aria-hidden />
        Payment is mocked — your account starts on a 7-day free trial. Cancel anytime.
      </p>
    </form>
  );
}
