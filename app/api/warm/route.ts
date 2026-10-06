/**
 * Wakes the generation engine before the visitor needs it.
 *
 * The engine runs on Render's free tier, which sleeps after ~15 min without
 * traffic and takes ~50 s to wake on the next request. /start pings this route
 * (lib/wake-engine.ts) when the questionnaire opens; by the time the visitor
 * clicks "send" about a minute later, the engine is up and the send takes
 * seconds instead of a minute.
 *
 * Any request wakes the instance, so we just GET the engine root: no engine
 * route or auth is needed, and its response (a 404) is ignored. Always 204.
 */

const API_BASE = process.env.DAYBREAK_API_URL ?? "http://localhost:3002";

// Room to wait out a cold start.
export const maxDuration = 60;

export async function POST(): Promise<Response> {
  try {
    await fetch(API_BASE, { cache: "no-store", signal: AbortSignal.timeout(55_000) });
  } catch {
    // Unreachable or still waking — nothing to do; the real send waits it out.
  }
  return new Response(null, { status: 204 });
}
