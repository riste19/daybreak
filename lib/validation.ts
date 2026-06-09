/** Shared validation/normalization for the waitlist form and API route. */

export const NOTE_MAX_LENGTH = 280;

// Pragmatic email shape check. Real deliverability is verified later (Prompt 2);
// here we only reject obviously-broken input without frustrating real users.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Lowercase + trim. Returns "" for non-strings. */
export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

/** Strip control chars, collapse whitespace, and cap length on the optional note. */
export function sanitizeNote(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NOTE_MAX_LENGTH);
}
