/**
 * Helpers for calling the standalone NestJS generation/delivery engine.
 *
 * The engine authenticates inbound calls with a shared secret sent as the
 * `x-api-key` header (see api/src/common/engine-auth.guard.ts). Set the SAME
 * value as `ENGINE_API_KEY` in this app and the engine's environment. When unset
 * (local dev) the header is simply omitted and the engine allows the call.
 */
export function engineHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.ENGINE_API_KEY;
  if (key) headers["x-api-key"] = key;
  return headers;
}
