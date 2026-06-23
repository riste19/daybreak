/**
 * Single source of truth for Daybreak's plans — the subscription page renders
 * entirely from this data (like lib/config.ts for branding and
 * onboarding-schema.ts for the questionnaire).
 *
 * Prices are PLACEHOLDERS — set the real amounts before launch. Plan `id`s line
 * up with `subscriptions.plan` in the DB (see lib/types/database.ts), so the
 * eventual checkout + account-creation step can map a chosen plan straight onto
 * a subscription row.
 */

export type BillingPeriod = "monthly" | "annual";

export interface PlanPrice {
  /** Per-month cost when paying month to month (0 = free). */
  monthly: number;
  /** Per-month cost when paying for a year up front (0 = free). */
  annual: number;
}

export interface PlanFeature {
  /** The feature line, shown next to a check. */
  label: string;
  /** Optional one-line clarifier under the label. */
  detail?: string;
  /** Headline differentiators get a warmer, emphasised treatment. */
  highlight?: boolean;
}

export interface Plan {
  /** Stable id — matches `subscriptions.plan`. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line positioning. */
  tagline: string;
  price: PlanPrice;
  /** CTA label on the card. */
  cta: string;
  /** Short "who it's for". */
  audience: string;
  /** The paid, recommended plan gets the spotlight treatment. */
  featured?: boolean;
  features: PlanFeature[];
}

/** Currency symbol used across the pricing UI. */
export const CURRENCY = "$";

/** Paying yearly is billed at the `annual` per-month rate × 12. */
export function annualTotal(plan: Plan): number {
  return plan.price.annual * 12;
}

/** Whole-dollars saved over a year by paying annually instead of monthly. */
export function annualSavings(plan: Plan): number {
  return plan.price.monthly * 12 - annualTotal(plan);
}

export const plans: Plan[] = [
  {
    id: "free_trial",
    name: "First Light",
    tagline: "Try a few mornings, on us.",
    price: { monthly: 0, annual: 0 },
    cta: "Start free",
    audience: "For seeing whether a morning email is for you.",
    features: [
      {
        label: "3 personalized mornings",
        detail: "Three mornings to feel the difference — no card needed.",
      },
      { label: "Up to 3 focus areas" },
      { label: "Choose your tone", detail: "Gentle, direct, playful, or stoic." },
      {
        label: "Pick a morning window",
        detail: "Lands in your chosen 6, 7, or 8am slot.",
      },
      { label: "One short email a day" },
    ],
  },
  {
    id: "daily",
    name: "Daybreak Daily",
    tagline: "A personal email, every single morning.",
    price: { monthly: 6, annual: 5 },
    cta: "Go Daily",
    featured: true,
    audience: "For making a personal morning a daily habit.",
    features: [
      {
        label: "A fresh, personalized email every day",
        detail: "Not a weekly taste — your mornings, every morning.",
        highlight: true,
      },
      {
        label: "Set the exact time it lands",
        detail: "Down to the minute, in your timezone — not just a window.",
        highlight: true,
      },
      {
        label: "Design your own email",
        detail: "Reorder sections, pin your own words, and add reminders in the builder.",
        highlight: true,
      },
      {
        label: "All 10 focus areas",
        detail: "Blend as many parts of your life as you like.",
      },
      {
        label: "Longer, more advanced writing",
        detail: "Richer craft and depth when you want more than a quick nudge.",
      },
      {
        label: "Twice a day, if you want it",
        detail: "A morning lift and an evening wind-down.",
      },
      {
        label: "Weekly specials",
        detail: "One longer, themed letter each week.",
      },
      {
        label: "Weekend editions",
        detail: "A slower, more reflective Saturday & Sunday tone.",
      },
      {
        label: "Gentle reminders",
        detail: "Nudges toward the goal you set, on the days that matter.",
      },
      {
        label: "Priority support from us",
        detail: "Real people, quick replies.",
      },
    ],
  },
];

/** Plan lookup by id (e.g. to validate a checkout selection). */
export function getPlan(id: string): Plan | undefined {
  return plans.find((p) => p.id === id);
}
