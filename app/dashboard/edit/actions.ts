"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, createServerClient } from "@/lib/supabase/client";
import { getCategory } from "@/lib/onboarding/onboarding-schema";
import { answersToPreferences } from "@/lib/onboarding/preferences";
import type { AnswerValue } from "@/lib/onboarding/resolveAnswers";
import type { EditState } from "./edit-state";

/**
 * Save the advanced morning-preferences editor.
 *
 * The client serializes its whole answer set ({ selectedCategories, values })
 * into a single hidden `payload` field — the question set is dynamic, so wiring
 * one form field per question isn't practical. We re-derive the discrete columns
 * here (never trusting client-derived values), then upsert via the service role
 * scoped to the *authenticated* user id (auth is verified in-app first).
 *
 * Note: state type + initial value live in ./edit-state — a "use server" file may
 * only export async functions.
 */

const MAX_PAYLOAD_BYTES = 20_000;

function fail(message: string): EditState {
  return { status: "error", message };
}

interface ParsedPayload {
  selectedCategories: string[];
  values: Record<string, AnswerValue>;
}

function parsePayload(raw: string): ParsedPayload | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const selectedCategories = Array.isArray(obj.selectedCategories)
    ? obj.selectedCategories.filter((c): c is string => typeof c === "string")
    : [];
  const values =
    obj.values && typeof obj.values === "object" && !Array.isArray(obj.values)
      ? (obj.values as Record<string, AnswerValue>)
      : {};
  return { selectedCategories, values };
}

export async function savePreferences(
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const user = await getSessionUser();
  if (!user) return fail("Your session has expired — please sign in again.");

  if (!isSupabaseAdminConfigured()) {
    return fail("Saving needs Supabase configured. Add your keys to .env.local.");
  }

  const raw = String(formData.get("payload") ?? "");
  if (!raw || raw.length > MAX_PAYLOAD_BYTES) {
    return fail("That didn't go through — please try again.");
  }

  const parsed = parsePayload(raw);
  if (!parsed) return fail("That didn't go through — please try again.");

  // Drop anything that isn't a real category before deriving.
  const selectedCategories = parsed.selectedCategories.filter((id) => getCategory(id));
  const derived = answersToPreferences({ selectedCategories, values: parsed.values });

  if (derived.focus_categories.length < 1) {
    return fail("Pick at least one focus area for your mornings.");
  }
  if (!derived.primary_goal) {
    return fail("Add the one-line goal your mornings should point toward.");
  }

  const admin = createServerClient();

  const { error: prefError } = await admin.from("user_preferences").upsert(
    {
      user_id: user.id,
      tone: derived.tone,
      send_time: derived.send_time,
      timezone: derived.timezone,
      primary_goal: derived.primary_goal,
      custom_notes: derived.custom_notes,
      focus_categories: derived.focus_categories,
      preferred_themes: derived.preferred_themes,
      answers: derived.answers,
    },
    { onConflict: "user_id" },
  );

  if (prefError) {
    console.error("[edit] failed to save preferences", prefError);
    return fail("We couldn't save your changes. Please try again.");
  }

  // Keep the display name on `users` in sync (non-fatal if it fails).
  const { error: nameError } = await admin
    .from("users")
    .update({ name: derived.name })
    .eq("id", user.id);
  if (nameError) console.error("[edit] failed to update name", nameError);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/edit");

  return { status: "success", message: "Saved — your mornings are updated." };
}
