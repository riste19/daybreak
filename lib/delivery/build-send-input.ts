import type { User, UserPreferences } from "@/lib/types/database";
import type { GenerationInput } from "@/lib/onboarding/buildGenerationInput";
import type { Theme, Tone } from "@/lib/onboarding/onboarding-schema";

/**
 * The body POSTed to the engine's `/delivery/send` (SendDailyInput): the
 * generation input plus the recipient + their saved layout. Mirrors the engine
 * contract in api/src/delivery/domain/types.ts (the api/ package is standalone,
 * so we don't import across the boundary — same pattern as buildGenerationInput).
 */
export type SendDailyBody = GenerationInput & {
  to: string;
  emailLayout?: UserPreferences["email_layout"];
};

const NAME_FALLBACK = "friend";

/**
 * Build the daily-send body from a stored subscriber + preferences. Unlike
 * buildGenerationInput (which maps raw onboarding answers), this maps the already
 * resolved, persisted preferences. `contextLines` is empty for v1 — goal, tone and
 * preferred themes carry the personalization.
 */
export function buildSendInputFromPrefs(
  user: User,
  prefs: UserPreferences,
  recentThemes: string[],
): SendDailyBody {
  return {
    to: user.email,
    name: user.name?.trim() || NAME_FALLBACK,
    primaryGoal: (prefs.primary_goal ?? "").trim(),
    tone: prefs.tone as Tone,
    customNotes: prefs.custom_notes?.trim() || undefined,
    contextLines: [],
    preferredThemes: (prefs.preferred_themes ?? []) as {
      theme: Theme;
      weight: number;
    }[],
    recentThemes: recentThemes as Theme[],
    emailLayout: prefs.email_layout,
  };
}
