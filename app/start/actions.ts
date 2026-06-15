"use server";

import { normalizeEmail, isValidEmail } from "@/lib/validation";
import { getCategory } from "@/lib/onboarding/onboarding-schema";
import { answersToPreferences } from "@/lib/onboarding/preferences";
import { recordTrialLead } from "@/lib/supabase/storage";
import type { AnswerValue } from "@/lib/onboarding/resolveAnswers";

/**
 * Capture a pre-registration "trial" lead from the no-login /start flow: the
 * email someone entered plus the answers they gave, so we can tell later which
 * trial emails converted vs. not — and pre-fill their account if they subscribe.
 *
 * Best-effort and fire-and-forget from the client: graceful no-op when Supabase
 * isn't configured, and it never surfaces an error to the questionnaire.
 *
 * Privacy note: this retains an anonymous email + answers. See trial_sends
 * (migration 005) — service-role only, never readable by the browser.
 */

interface CaptureTrialLeadInput {
  email: string;
  selectedCategories: string[];
  values: Record<string, AnswerValue>;
  /** PostHog distinct id, to stitch this lead to the funnel. */
  distinctId?: string | null;
}

export async function captureTrialLead(
  input: CaptureTrialLeadInput,
): Promise<{ ok: boolean }> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) return { ok: false };

  // No service-role env → nothing to write to. Graceful demo path.
  const { isSupabaseAdminConfigured } = await import("@/lib/supabase/client");
  if (!isSupabaseAdminConfigured()) return { ok: false };

  const selectedCategories = (
    Array.isArray(input.selectedCategories) ? input.selectedCategories : []
  ).filter((id) => typeof id === "string" && getCategory(id));
  const values =
    input.values && typeof input.values === "object" ? input.values : {};

  const derived = answersToPreferences({ selectedCategories, values });

  try {
    await recordTrialLead({
      email,
      answers: derived.answers,
      focusCategories: derived.focus_categories,
      primaryGoal: derived.primary_goal,
      tone: derived.tone,
      posthogDistinctId: input.distinctId ?? null,
    });
    return { ok: true };
  } catch (err) {
    console.error("[start] failed to capture trial lead", err);
    return { ok: false };
  }
}
