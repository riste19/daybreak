/**
 * Owner ("admin") allowlist — SERVER-ONLY.
 *
 * Used to gate dev/admin-only surfaces (currently the onboarding "Debug" review
 * screen) to the product owners. Only ever import this from server code (Server
 * Components, route handlers, Server Actions): the email list must never reach
 * the browser. Client components receive a derived boolean instead.
 *
 * Source of truth is the hardcoded list below; a comma-separated `ADMIN_EMAILS`
 * env var (server-only, NOT NEXT_PUBLIC_) overrides it when set.
 */

const OWNER_EMAILS = ["rsemenkovski@gmail.com", "gorgikos20@gmail.com"];

function ownerList(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : OWNER_EMAILS.map((e) => e.toLowerCase());
}

/** True only for a known owner email (case-insensitive). Safe on null/undefined. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerList().includes(email.trim().toLowerCase());
}
