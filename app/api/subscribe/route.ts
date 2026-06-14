/**
 * Persists a subscriber + preferences when onboarding completes. Server-side and
 * service-role (see subscribeUser) — no auth/login required. Idempotent by email.
 */

import { isValidEmail } from "@/lib/validation";
import { subscribeUser } from "@/lib/supabase/storage";
import type { UserPreferences } from "@/lib/types/database";

type SubscribePayload = {
  email?: string;
  name?: string | null;
  tone?: UserPreferences["tone"];
  send_time?: UserPreferences["send_time"];
  timezone?: string;
  primary_goal?: string;
  custom_notes?: string;
  preferred_themes?: UserPreferences["preferred_themes"];
  focus_categories?: UserPreferences["focus_categories"];
  email_layout?: UserPreferences["email_layout"];
};

export async function POST(request: Request): Promise<Response> {
  let body: SubscribePayload;
  try {
    body = (await request.json()) as SubscribePayload;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  // Undefined fields are dropped during JSON serialization, so they won't
  // overwrite existing preferences on a re-subscribe.
  const preferences: Partial<UserPreferences> = {
    tone: body.tone,
    send_time: body.send_time,
    timezone: body.timezone,
    primary_goal: body.primary_goal,
    custom_notes: body.custom_notes,
    preferred_themes: body.preferred_themes,
    focus_categories: body.focus_categories,
    email_layout: body.email_layout,
  };

  try {
    await subscribeUser({ email, name: body.name ?? null, preferences });
    return Response.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "Could not save your subscription.", detail },
      { status: 500 },
    );
  }
}
