/** Shared, pragmatic email validation/normalization. */

// Pragmatic shape check — rejects obviously-broken input without frustrating
// real users. True deliverability is verified server-side later.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Lowercase + trim. Returns "" for non-strings. */
export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}
