"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";

import {
  CheckoutEventNames,
  initializePaddle,
  type Paddle,
} from "@paddle/paddle-js";

import { cn } from "@/lib/utils";
import {
  annualSavings,
  annualTotal,
  CURRENCY,
  plans,
  type BillingPeriod,
  type Plan,
} from "@/lib/pricing";
import {
  isPaddleConfigured,
  paddleClientToken,
  paddleEnvironment,
  priceIdFor,
} from "@/lib/billing/config";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSubscriberAccount } from "@/app/subscribe/actions";
import {
  initialCheckoutState,
  type CheckoutState,
} from "@/app/subscribe/checkout-state";

/**
 * The pricing surface: a monthly/annual toggle and the plan cards (from
 * lib/pricing.ts). The free plan sends people into onboarding; the paid plan
 * opens a MODAL checkout. When Paddle is configured the modal collects an email
 * and opens Paddle's secure overlay (PaddleCheckoutPanel); otherwise it falls
 * back to the MOCK card form (see app/subscribe/actions.ts) for local demos.
 *
 * `defaultEmail` (from the `?email=` the daily email's "Go daily" link carries)
 * pre-fills the checkout and auto-opens it, so arriving from the email drops you
 * straight into a ready-to-pay form.
 */
export function PricingPlans({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [period, setPeriod] = React.useState<BillingPeriod>("annual");
  const featured = React.useMemo(() => plans.find((p) => p.featured) ?? null, []);
  // Arriving from the email (email param present) → open the paid checkout.
  const [checkoutPlan, setCheckoutPlan] = React.useState<Plan | null>(
    defaultEmail ? featured : null,
  );

  return (
    <div>
      <BillingToggle period={period} onChange={setPeriod} />

      <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            onSubscribe={() => setCheckoutPlan(plan)}
          />
        ))}
      </div>

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          period={period}
          defaultEmail={defaultEmail}
          onClose={() => setCheckoutPlan(null)}
        />
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
        Save with annual, two months free.
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
              <span className={cn("text-sm text-ink", feature.highlight && "font-medium")}>
                {feature.label}
              </span>
              {feature.detail && (
                <span className="mt-0.5 block text-sm text-ink-soft">{feature.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────── Checkout modal ─────────────────────────────── */

function CheckoutModal({
  plan,
  period,
  defaultEmail,
  onClose,
}: {
  plan: Plan;
  period: BillingPeriod;
  defaultEmail: string;
  onClose: () => void;
}) {
  // Real checkout runs through Paddle (the overlay below). When Paddle isn't
  // configured (local dev without keys) we fall back to the mock server-action
  // form so the flow still demos end-to-end.
  const paddleReady = isPaddleConfigured();

  const [state, formAction, pending] = useActionState(
    createSubscriberAccount,
    initialCheckoutState,
  );
  // Paddle path completion (the mock path uses `state.status === "success"`).
  const [paddleDone, setPaddleDone] = React.useState(false);

  // Close on Escape; lock background scroll while open.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const perMonth = period === "annual" ? plan.price.annual : plan.price.monthly;
  const showSuccess = paddleReady ? paddleDone : state.status === "success";
  const successMessage = paddleReady
    ? `Your ${plan.name} subscription is on its way. Your trial starts now — ` +
      `we'll only charge the card you entered when it ends, and you can cancel anytime.`
    : state.status === "success"
      ? state.message
      : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-night/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-reveal relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
        >
          <X className="size-4" />
        </button>

        {showSuccess ? (
          <SuccessPanel message={successMessage} onClose={onClose} />
        ) : paddleReady ? (
          <PaddleCheckoutPanel
            plan={plan}
            period={period}
            perMonth={perMonth}
            defaultEmail={defaultEmail}
            onCompleted={() => setPaddleDone(true)}
          />
        ) : (
          <CheckoutForm
            plan={plan}
            period={period}
            perMonth={perMonth}
            defaultEmail={defaultEmail}
            state={state}
            formAction={formAction}
            pending={pending}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The real checkout: collect the email (so we can pre-fill + stamp it into the
 * subscription's customData for reliable provisioning) then open Paddle's hosted
 * overlay. Paddle takes the card, starts the trial, and — on `checkout.completed`
 * — fires our callback; the actual account is created server-side by the Paddle
 * webhook (app/api/webhooks/paddle/route.ts), so it survives a closed tab.
 */
function PaddleCheckoutPanel({
  plan,
  period,
  perMonth,
  defaultEmail,
  onCompleted,
}: {
  plan: Plan;
  period: BillingPeriod;
  perMonth: number;
  defaultEmail: string;
  onCompleted: () => void;
}) {
  const [email, setEmail] = React.useState(defaultEmail);
  const [error, setError] = React.useState<string | null>(null);
  const [opening, setOpening] = React.useState(false);

  const paddleRef = React.useRef<Paddle | null>(null);
  // Keep the latest completion handler without re-initializing Paddle.
  const onCompletedRef = React.useRef(onCompleted);
  React.useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  React.useEffect(() => {
    let active = true;
    initializePaddle({
      environment: paddleEnvironment,
      token: paddleClientToken,
      eventCallback: (event) => {
        if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
          onCompletedRef.current();
        }
      },
    })
      .then((instance) => {
        if (active && instance) paddleRef.current = instance;
      })
      .catch((err) => {
        console.error("[paddle] failed to initialize", err);
        if (active) setError("Checkout couldn't load. Please refresh and try again.");
      });
    return () => {
      active = false;
    };
  }, []);

  const priceId = priceIdFor(plan.id, period);

  function openCheckout() {
    setError(null);
    const cleaned = normalizeEmail(email);
    if (!isValidEmail(cleaned)) {
      setError("That email doesn't look quite right.");
      return;
    }
    const paddle = paddleRef.current;
    if (!paddle || !priceId) {
      setError("Checkout isn't available right now. Please try again in a moment.");
      return;
    }
    setOpening(true);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: cleaned },
      customData: { email: cleaned, plan: plan.id, period },
      settings: { displayMode: "overlay", theme: "light" },
    });
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
        Subscribing to
      </p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <h3 id="checkout-title" className="font-display text-xl font-medium text-ink">
          {plan.name}
        </h3>
        <p className="shrink-0 text-right text-sm text-ink-soft">
          <span className="font-display text-2xl font-medium text-ink">
            {CURRENCY}
            {perMonth}
          </span>
          <br />/ month, billed {period === "annual" ? "yearly" : "monthly"}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-5">
        <Field id="checkout-email" label="Where should your mornings land?">
          <Input
            id="checkout-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>

      <Button
        type="button"
        size="lg"
        variant="glow"
        className="mt-6 w-full"
        onClick={openCheckout}
        disabled={opening}
      >
        {opening ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Opening secure checkout…
          </>
        ) : (
          <>
            <Lock className="size-4" aria-hidden />
            Continue to secure checkout
          </>
        )}
      </Button>

      <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-soft">
        <CreditCard className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          Payments are handled securely by Paddle. Your trial starts now — we only
          charge when it ends, and you can cancel anytime.
        </span>
      </p>
    </div>
  );
}

function SuccessPanel({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="pt-2 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-6" aria-hidden />
      </span>
      <h3 id="checkout-title" className="mt-5 font-display text-2xl font-medium text-ink">
        You&apos;re on board
      </h3>
      <p className="mx-auto mt-3 text-ink-soft">{message}</p>
      <div className="mt-7 flex flex-col gap-3">
        <Button asChild size="lg" variant="glow">
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
        Manage it anytime.{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          sign in
        </Link>{" "}
        with your email.
      </p>
    </div>
  );
}

function CheckoutForm({
  plan,
  period,
  perMonth,
  defaultEmail,
  state,
  formAction,
  pending,
}: {
  plan: Plan;
  period: BillingPeriod;
  perMonth: number;
  defaultEmail: string;
  state: CheckoutState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const values = state.status === "error" ? state.values : null;
  const error = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="planId" value={plan.id} />
      <input type="hidden" name="period" value={period} />

      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
        Subscribing to
      </p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <h3 id="checkout-title" className="font-display text-xl font-medium text-ink">
          {plan.name}
        </h3>
        <p className="shrink-0 text-right text-sm text-ink-soft">
          <span className="font-display text-2xl font-medium text-ink">
            {CURRENCY}
            {perMonth}
          </span>
          <br />/ month, billed {period === "annual" ? "yearly" : "monthly"}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4">
        <Field id="checkout-email" label="Where should your mornings land?">
          <Input
            id="checkout-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={values?.email ?? defaultEmail}
          />
        </Field>

        <Field id="cardName" label="Name on card">
          <Input
            id="cardName"
            name="cardName"
            autoComplete="cc-name"
            placeholder="Maya Sterling"
            defaultValue={values?.cardName}
          />
        </Field>

        <Field id="cardNumber" label="Card number">
          <Input
            id="cardNumber"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            defaultValue={values?.cardNumber}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="cardExpiry" label="Expiry (MM/YY)">
            <Input
              id="cardExpiry"
              name="cardExpiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="12/34"
              defaultValue={values?.cardExpiry}
            />
          </Field>
          <Field id="cardCvc" label="CVC">
            <Input
              id="cardCvc"
              name="cardCvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
            />
          </Field>
        </div>
      </div>

      <Button type="submit" size="lg" variant="glow" className="mt-6 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Processing…
          </>
        ) : (
          <>
            <Lock className="size-4" aria-hidden />
            Pay {CURRENCY}
            {perMonth}/mo &amp; subscribe
          </>
        )}
      </Button>

      <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-soft">
        <CreditCard className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          Mock payment, no real charge (Paddle isn&apos;t configured). Test card{" "}
          <span className="font-medium text-ink">4242 4242 4242 4242</span>, any future
          date, any CVC. Your 3-day trial starts now.
        </span>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-ink">
        {label}
      </Label>
      {children}
    </div>
  );
}
