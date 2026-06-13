/**
 * Same-origin proxy to the delivery flow (NestJS, separate app — see
 * app/api/generate/route.ts for the pattern and rationale).
 *
 * The browser POSTs a SendDailyInput (GenerationInput + `to`, optional
 * `personalNote`) here; we forward it to the engine's /delivery/send, which
 * generates the email, renders the branded template, and actually sends it
 * (Resend when RESEND_API_KEY is set; logged to the engine console otherwise).
 */

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
      headers: { "Content-Type": "application/json" },
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
  return Response.json(parsed, { status: upstream.status });
}
