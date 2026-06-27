/**
 * Paddle billing configuration — the bridge between our plan/period vocabulary
 * (lib/pricing.ts) and Paddle's price ids, plus the public client config the
 * checkout overlay needs.
 *
 * What's public vs secret:
 *   • Client token, environment, price ids → PUBLIC by design (Paddle.js reads
 *     them in the browser), hence the NEXT_PUBLIC_ prefix.
 *   • API key + webhook secret → SERVER ONLY, see lib/billing/paddle.server.ts.
 *
 * Create the product + recurring prices in the Paddle dashboard (with a 3-day
 * trial configured on each price — Paddle owns the trial, see migration 007),
 * then paste the `pri_…` ids into the env vars below.
 */

import type { BillingPeriod } from "@/lib/pricing";
import type { SubscriptionStatus } from "@/lib/types/database";

export type PaddleEnvironment = "sandbox" | "production";

export const paddleEnvironment: PaddleEnvironment =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

/** Public client-side token (`live_…`/`test_…`) used to boot Paddle.js. */
export const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";

/**
 * plan id (lib/pricing.ts) → Paddle price id, per billing period. Only the paid
 * `daily` plan is sold through checkout; the free trial never hits Paddle.
 */
const PRICE_IDS: Record<string, Partial<Record<BillingPeriod, string>>> = {
  daily: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_DAILY_MONTHLY,
    annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_DAILY_ANNUAL,
  },
};

/** Forward lookup for opening checkout: plan + period → Paddle price id. */
export function priceIdFor(planId: string, period: BillingPeriod): string | undefined {
  return PRICE_IDS[planId]?.[period];
}

/** Reverse lookup for the webhook: Paddle price id → our plan + period. */
export function planForPriceId(
  priceId: string,
): { planId: string; period: BillingPeriod } | undefined {
  for (const [planId, byPeriod] of Object.entries(PRICE_IDS)) {
    for (const period of ["monthly", "annual"] as const) {
      if (byPeriod[period] === priceId) return { planId, period };
    }
  }
  return undefined;
}

/** True when the paid plan's checkout can actually open (token + both prices set). */
export function isPaddleConfigured(): boolean {
  return Boolean(
    paddleClientToken && priceIdFor("daily", "monthly") && priceIdFor("daily", "annual"),
  );
}

/**
 * Map a Paddle subscription status onto ours. `past_due` deliberately stays
 * 'active' so the subscriber keeps receiving mail while Paddle retries the
 * charge (dunning); only a real cancel/pause stops the daily send.
 */
export function mapPaddleStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
    case "past_due":
      return "active";
    case "paused":
    case "canceled":
      return "cancelled";
    default:
      return "cancelled";
  }
}
