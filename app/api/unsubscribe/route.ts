/**
 * Marks a subscriber's subscription cancelled so the daily cron skips them.
 * Server-side / service-role (see cancelSubscriptionByEmail).
 */

import { isValidEmail } from "@/lib/validation";
import { cancelSubscriptionByEmail } from "@/lib/supabase/storage";

export async function POST(request: Request): Promise<Response> {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    await cancelSubscriptionByEmail(email);
    // Respond OK whether or not the email was subscribed (don't reveal it).
    return Response.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "Could not process the request.", detail },
      { status: 500 },
    );
  }
}
