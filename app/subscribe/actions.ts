"use server";

import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { getPlan, type BillingPeriod } from "@/lib/pricing";
import { isSupabaseAdminConfigured } from "@/lib/supabase/client";
import { AccountExistsError, provisionSubscriber } from "@/lib/supabase/storage";
import type { CheckoutState, CheckoutValues } from "./checkout-state";

/**
 * Subscriber checkout: a MOCK card "charge" followed by account creation.
 *
 * Payment is simulated — no real processor. Use the test cards below:
 *   • 4242 4242 4242 4242  → succeeds
 *   • 4000 0000 0000 0002  → declined
 * (any future expiry MM/YY, any 3–4 digit CVC, any name).
 *
 * When Supabase is configured (service-role env present) a real account is then
 * created (Supabase Auth user + users/subscriptions/user_preferences, see
 * provisionSubscriber); the subscription starts as a 7-day trial. Without keys
 * it takes a graceful DEMO path — validates everything, writes nothing.
 *
 * Note: state type + initial state live in ./checkout-state — a "use server"
 * file may only export async functions.
 */

const TRIAL_DAYS = 7;
// Test cards: 4242 4242 4242 4242 succeeds; this one is declined.
const TEST_CARD_DECLINE = "4000000000000002";

function isBillingPeriod(value: string): value is BillingPeriod {
  return value === "monthly" || value === "annual";
}

function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

/** MM/YY (slash optional, spaces tolerated) that is not in the past. */
function isValidExpiry(raw: string): boolean {
  const m = raw.trim().match(/^(0[1-9]|1[0-2])\s*\/?\s*([0-9]{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  // Expires at the end of the named month.
  const expires = new Date(year, month, 0, 23, 59, 59, 999);
  return expires.getTime() >= Date.now();
}

export async function createSubscriberAccount(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const planId = String(formData.get("planId") ?? "");
  const period = String(formData.get("period") ?? "monthly");
  const email = normalizeEmail(formData.get("email"));

  const cardName = String(formData.get("cardName") ?? "").trim();
  const cardNumberRaw = String(formData.get("cardNumber") ?? "").trim();
  const cardExpiry = String(formData.get("cardExpiry") ?? "").trim();
  const cardNumber = onlyDigits(cardNumberRaw);
  const cardCvc = onlyDigits(String(formData.get("cardCvc") ?? ""));

  // Echo back everything except the CVC so the modal can repopulate on error.
  const values: CheckoutValues = { email, cardName, cardNumber: cardNumberRaw, cardExpiry };
  const fail = (message: string): CheckoutState => ({ status: "error", message, values });

  const plan = getPlan(planId);
  if (!plan || !plan.featured) {
    return fail("That plan isn't available to subscribe to. Please try again.");
  }
  if (!email) return fail("Add the email you'd like your mornings sent to.");
  if (!isValidEmail(email)) return fail("That email doesn't look quite right.");

  // ── Mock payment ──────────────────────────────────────────────────────────
  if (!cardName) return fail("Enter the name on the card.");
  if (cardNumber.length !== 16) {
    return fail("Enter a valid 16-digit card number — try 4242 4242 4242 4242.");
  }
  if (!isValidExpiry(cardExpiry)) {
    return fail("Enter a valid future expiry date (MM/YY).");
  }
  if (cardCvc.length < 3 || cardCvc.length > 4) {
    return fail("Enter the card's 3-digit security code (CVC).");
  }
  if (cardNumber === TEST_CARD_DECLINE) {
    return fail("Your card was declined. Use 4242 4242 4242 4242 to test a successful payment.");
  }
  // Any other well-formed number (incl. TEST_CARD_SUCCESS) "charges" successfully.

  const billing = isBillingPeriod(period) ? period : "monthly";

  // No Supabase keys → graceful demo (payment validated, nothing written).
  if (!isSupabaseAdminConfigured()) {
    console.info("[subscribe] mock charge OK; account demo (Supabase not configured)", {
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
        `Payment accepted (mock — no real charge). Supabase isn't configured, so no ` +
        `account was created; with keys set, ${email} would get a ${plan.name} account.`,
    };
  }

  try {
    const { subscription } = await provisionSubscriber({
      email,
      plan: plan.id,
      trialDays: TRIAL_DAYS,
    });
    console.info("[subscribe] mock charge OK; account created", {
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
        `Payment accepted (mock — no real charge). Your ${plan.name} account is ready and ` +
        `your mornings will go to ${email}. Your ${TRIAL_DAYS}-day trial starts now.`,
    };
  } catch (err) {
    if (err instanceof AccountExistsError) {
      return fail(`Looks like ${email} already has an account — try signing in instead.`);
    }
    console.error("[subscribe] account creation failed", err);
    return fail("Payment went through but we couldn't set up your account. Please contact us.");
  }
}
