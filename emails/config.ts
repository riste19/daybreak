/**
 * Brand-level constants shared by every template + the send helper.
 *
 * DOMAIN is the one placeholder to swap when the sending domain changes — it
 * flows into the `from` address, the support/unsubscribe mailboxes, and the
 * default links used in previews. Real per-recipient URLs (which carry an
 * unsubscribe/account token) are passed into each template as props; the values
 * here are sensible defaults so `email dev` previews render without wiring.
 */

/** ← The single swap point. Daybreak's verified Resend domain. */
export const DOMAIN = "daybreakmail.com";

export const SITE_URL = `https://${DOMAIN}`;

/**
 * The typed sender, in display-name format. Resend requires the angle-bracket
 * form; the display name is what recipients see in their inbox list.
 */
export const from: string = `Daybreak <hello@${DOMAIN}>`;

/** Where replies land, and the mailbox behind the List-Unsubscribe mailto. */
export const SUPPORT_EMAIL = `hello@${DOMAIN}`;
export const UNSUBSCRIBE_MAILTO = `mailto:unsubscribe@${DOMAIN}?subject=unsubscribe`;

export const tagline = "A fresh, personal nudge in your inbox every morning.";

/**
 * Free-trial length in days. The single source of truth for every "N-day trial"
 * string across these templates. MUST stay in sync with the app's provisioning
 * value (`TRIAL_DAYS` in app/subscribe/actions.ts) — they are hand-synced.
 */
export const TRIAL_LENGTH_DAYS = 3;

/**
 * Default brand links. Callers should pass per-recipient (tokenised) URLs into
 * the templates instead — these power previews and act as fallbacks.
 */
export const links = {
  site: SITE_URL,
  subscribe: `${SITE_URL}/subscribe`,
  /** Preferences editor (auth-gated — app/dashboard/edit). */
  preferences: `${SITE_URL}/dashboard/edit`,
  /** Account home. */
  manage: `${SITE_URL}/dashboard`,
  /** No dedicated billing page yet — points at the dashboard. */
  billing: `${SITE_URL}/dashboard`,
  /** Visible footer unsubscribe + the https half of List-Unsubscribe. */
  unsubscribe: `${SITE_URL}/unsubscribe`,
} as const;

/** Optional hosted sunburst mark. Null → the wordmark uses a text glyph. */
export const LOGO_URL: string | null = null;
