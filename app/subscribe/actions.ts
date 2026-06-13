"use server";

import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { getPlan, type BillingPeriod } from "@/lib/pricing";

/**
 * MOCK subscription flow.
 *
 * This is the first of the two "next steps": it stands in for a real checkout
 * (Stripe et al.) and, later, account creation. Right now it only validates the
 * selection and the email, logs it, and returns a success contract — no payment,
 * no `users`/`subscriptions` row written yet. When checkout + auth land, swap the
 * body of this action for the real thing; the form and the success shape stay.
 */

export type CheckoutState =
  | { status: "idle" }
  | { status: "success"; planName: string; email: string; message: string }
  | {
      status: "error";
      message: string;
      /** Echo back the typed email so the form can repopulate after an error. */
      email: string;
    };

export const initialCheckoutState: CheckoutState = { status: "idle" };

function isBillingPeriod(value: string): value is BillingPeriod {
  return value === "monthly" || value === "annual";
}

export async function startMockCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const planId = String(formData.get("planId") ?? "");
  const period = String(formData.get("period") ?? "monthly");
  const email = normalizeEmail(formData.get("email"));

  const plan = getPlan(planId);
  if (!plan || !plan.featured) {
    return {
      status: "error",
      message: "That plan isn't available to subscribe to. Please try again.",
      email,
    };
  }
  if (!email) {
    return { status: "error", message: "Add the email you'd like your mornings sent to.", email };
  }
  if (!isValidEmail(email)) {
    return { status: "error", message: "That email doesn't look quite right.", email };
  }

  const billing = isBillingPeriod(period) ? period : "monthly";

  // No real checkout or account yet — log so the selection is visible in dev.
  // NEXT STEPS: create the Supabase Auth user + a `users` row, open a real
  // checkout session, and on success write the `subscriptions` row (plan = id).
  console.info("[subscribe] mock checkout", { planId: plan.id, billing, email });

  return {
    status: "success",
    planName: plan.name,
    email,
    message:
      `You're set for ${plan.name} (mock — no payment taken). ` +
      `We've noted ${email}; real checkout and your account are the next step.`,
  };
}
