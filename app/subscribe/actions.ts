"use server";

import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { getPlan, type BillingPeriod } from "@/lib/pricing";
import { isSupabaseAdminConfigured } from "@/lib/supabase/client";
import { AccountExistsError, provisionSubscriber } from "@/lib/supabase/storage";
import type { CheckoutState } from "./checkout-state";

/**
 * Subscriber account creation.
 *
 * When Supabase is configured (service-role env present) this creates a real
 * account: a Supabase Auth user plus the `users`, `subscriptions`, and
 * `user_preferences` rows (see provisionSubscriber). Payment is still mocked —
 * the subscription starts as a 7-day trial until real billing converts it.
 *
 * Without Supabase keys (e.g. local dev), it takes a graceful DEMO path: it
 * validates everything but writes nothing, so the flow can still be exercised.
 *
 * Note: state type + initial state live in ./checkout-state — a "use server"
 * file may only export async functions.
 */

const TRIAL_DAYS = 7;

function isBillingPeriod(value: string): value is BillingPeriod {
  return value === "monthly" || value === "annual";
}

export async function createSubscriberAccount(
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

  // No Supabase keys → graceful demo (validates, writes nothing). Lets the flow
  // be tried locally without a database.
  if (!isSupabaseAdminConfigured()) {
    console.info("[subscribe] account (demo — Supabase not configured)", {
      planId: plan.id,
      billing,
      email,
    });
    return {
      status: "success",
      planName: plan.name,
      email,
      demo: true,
      message:
        `Demo mode: Supabase isn't configured, so no account was created. ` +
        `With keys set, ${email} would get a ${plan.name} account.`,
    };
  }

  try {
    const { subscription } = await provisionSubscriber({
      email,
      plan: plan.id,
      trialDays: TRIAL_DAYS,
    });
    console.info("[subscribe] account created", {
      planId: plan.id,
      billing,
      email,
      subscriptionId: subscription.id,
    });
    return {
      status: "success",
      planName: plan.name,
      email,
      demo: false,
      message:
        `Your ${plan.name} account is ready — your mornings will go to ${email}. ` +
        `Your ${TRIAL_DAYS}-day trial starts now; we'll only charge you after it ends.`,
    };
  } catch (err) {
    if (err instanceof AccountExistsError) {
      return {
        status: "error",
        message: `Looks like ${email} already has an account — try signing in instead.`,
        email,
      };
    }
    console.error("[subscribe] account creation failed", err);
    return {
      status: "error",
      message: "Something went wrong creating your account. Please try again.",
      email,
    };
  }
}
