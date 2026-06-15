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
    "Daybreak is a personalized daily motivational email — one short, AI-written note each morning, shaped to your goals and tasks, in the tone and at the time you choose. No app, no feed. Just a calm start to the day.",
  /**
   * Canonical site URL — drives metadataBase, canonicals, sitemap & OG tags.
   * Set `NEXT_PUBLIC_SITE_URL` in the environment (e.g. the Vercel domain, and a
   * custom domain once you have one); falls back to the placeholder for local
   * dev. Trailing slashes are stripped so URL joins stay clean.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daybreak.email").replace(
    /\/+$/,
    "",
  ),
  /** Contact address shown in the footer. */
  contactEmail: "gorgikos20@gmail.com",
  /** Placeholder social link (swap for your real handle). */
  social: {
    label: "@daybreak",
    href: "https://x.com/daybreak",
  },
} as const;
