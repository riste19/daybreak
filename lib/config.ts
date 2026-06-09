/**
 * Single source of truth for product naming and brand copy.
 *
 * Rename the product here and it changes everywhere — title, nav, footer,
 * metadata, sample email signature, etc. Do not hardcode the name elsewhere.
 */
export const site = {
  /** Working name — change this one value to rename the whole product. */
  name: "Daybreak",
  /** One-line tagline used in the footer and metadata. */
  tagline: "A fresh, personal nudge in your inbox every morning.",
  /** Short description for SEO / social cards. */
  description:
    "Daybreak sends one short, AI-written email each morning — personalized to your goals and tasks, in a tone you choose, at the time you set. No app, no feed. Just a calm start to the day.",
  /** Canonical URL — update to your real domain before launch. */
  url: "https://daybreak.email",
  /** Contact address shown in the footer. */
  contactEmail: "hello@daybreak.email",
  /** Placeholder social link (swap for your real handle). */
  social: {
    label: "@daybreak",
    href: "https://x.com/daybreak",
  },
} as const;
