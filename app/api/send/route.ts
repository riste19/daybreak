/**
 * Same-origin proxy to the delivery flow (NestJS, separate app — see
 * app/api/generate/route.ts for the pattern and rationale).
 *
 * The browser POSTs a SendDailyInput (GenerationInput + `to`, optional
 * `personalNote`) here; we forward it to the engine's /delivery/send, which
 * generates the email, renders the branded template, and actually sends it
 * (Resend when RESEND_API_KEY is set; logged to the engine console otherwise).
 */

import { engineHeaders } from "@/lib/engine";

const API_BASE = process.env.DAYBREAK_API_URL ?? "http://localhost:3002";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/delivery/send`, {
      method: "POST",
      headers: engineHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Could not reach the delivery engine at ${API_BASE}.`, detail },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Delivery engine returned a non-JSON response.", body: text },
      { status: 502 },
    );
  }

  // A real one-off delivery → mark the trial lead as 'sent' (best-effort).
  if (upstream.ok) {
    await recordTrialSendFromResponse(body, parsed);
  }

  return Response.json(parsed, { status: upstream.status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * If the request delivered an email to a recipient, record it against the trial
 * lead. Only a response carrying a `messageId` (an actual send, not a preview)
 * counts. Entirely best-effort: never affects the proxied response.
 */
async function recordTrialSendFromResponse(body: unknown, parsed: unknown): Promise<void> {
  const to = isRecord(body) && typeof body.to === "string" ? body.to.trim() : "";
  const result = isRecord(parsed) ? parsed : null;
  if (!to || !result || typeof result.messageId !== "string") return;

  const { isSupabaseAdminConfigured } = await import("@/lib/supabase/client");
  if (!isSupabaseAdminConfigured()) return;

  const { recordTrialSend } = await import("@/lib/supabase/storage");
  try {
    await recordTrialSend({
      email: to,
      subject: typeof result.subject === "string" ? result.subject : "",
      theme: typeof result.theme === "string" ? result.theme : "",
      usedFallback: typeof result.usedFallback === "boolean" ? result.usedFallback : false,
    });
  } catch (err) {
    console.error("[api/send] failed to record trial send", err);
  }
}
