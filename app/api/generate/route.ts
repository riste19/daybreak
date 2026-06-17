/**
 * Same-origin proxy to the generation engine (NestJS, separate app on :3001).
 *
 * The browser POSTs a GenerationInput here; we forward it to the engine's
 * /generate/preview and pass the upstream status + JSON body straight back. This
 * keeps the engine URL server-side and sidesteps CORS, while still surfacing the
 * engine's own 400 validation errors to the debug window. If the engine is
 * unreachable, we answer 502 with a readable JSON error rather than throwing.
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
    upstream = await fetch(`${API_BASE}/generate/preview`, {
      method: "POST",
      headers: engineHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Could not reach the generation engine at ${API_BASE}.`, detail },
      { status: 502 },
    );
  }

  // Pass the engine's response through. It returns JSON for both success
  // (GenerationResult) and validation failures (NestJS error envelope), but
  // guard against a non-JSON body so the debug window always gets parseable JSON.
  const text = await upstream.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Generation engine returned a non-JSON response.", body: text },
      { status: 502 },
    );
  }
  return Response.json(parsed, { status: upstream.status });
}
