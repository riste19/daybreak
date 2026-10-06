/**
 * Fire-and-forget ping that wakes the engine ahead of a send (see
 * app/api/warm/route.ts). Safe to call from the browser; never throws.
 */
export function wakeEngine(): void {
  fetch("/api/warm", { method: "POST" }).catch(() => {});
}
