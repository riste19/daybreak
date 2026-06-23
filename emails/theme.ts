/**
 * Daybreak email design tokens — the single re-skin point.
 *
 * Every colour, font, and spacing value used by the templates lives here. Change
 * a value once and all six emails restyle. The palette is lifted from the app's
 * dawn world (app/globals.css) and is intentionally a hand-kept *mirror* of the
 * engine's `DEFAULT_BRANDING.colors` (api/src/delivery/template/render-email.ts)
 * and the builder preview's `C` (components/email-builder/email-preview.tsx) —
 * the repo keeps cross-boundary copies in sync by hand rather than importing
 * across the api/ package line. If you change a colour here, change it there too.
 *
 * Alternative directions (not implemented — swap values here to explore):
 *   • editorial-letter — drop the card + gradient bar, full-bleed cream page,
 *     a single hairline rule under the wordmark, larger serif body at 18px,
 *     wider measure. Reads like a printed letter.
 *   • warm-minimal — white (not cream) surface, charcoal ink, one warm accent
 *     used only on links/CTA, no dawn gradient, tighter vertical rhythm.
 */

export const theme = {
  color: {
    /** Page background behind the card. */
    page: "#f6ecdd",
    /** Card surface. */
    card: "#fffdf9",
    /** Hairline borders. */
    border: "#e9dcc6",
    /** Primary text. */
    ink: "#2a2118",
    /** Muted text (captions, legal, signature). */
    inkSoft: "#6f6353",
    /** Warm accent — links, label, CTA fill. Accessible amber-brown on cream. */
    accent: "#b6651a",
    /** Tinted panel behind notes / receipt blocks. */
    accentSoft: "#fdf3e0",
    /** Text colour on top of an accent-filled button. */
    onAccent: "#fffdf9",
    /** Dawn gradient stops for the top bar: twilight → horizon → amber → gold. */
    dawn: ["#241b40", "#3a2a4d", "#f5a623", "#ffd27a"] as const,
  },

  font: {
    /** Serif display face for headings + the wordmark. */
    display: "'Fraunces', Georgia, 'Times New Roman', serif",
    /** Body / UI sans — system stack, renders everywhere. */
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    /** Fallback the display face degrades to (the guaranteed floor). */
    displayFallback: "Georgia, 'Times New Roman', serif",
  },

  /**
   * Optional webfont for the display face, loaded via <Font>. Webfonts only
   * render in a few clients (Apple Mail, iOS Mail) — everything else falls back
   * to Georgia, which is why the URL is non-load-bearing. Leave `url` empty to
   * ship Georgia everywhere; set a self-hosted/Google-Fonts woff2 URL to opt in.
   * Self-hosting is recommended for production reliability.
   */
  displayWebFont: {
    family: "Fraunces",
    url: "", // e.g. "https://your-cdn/fraunces-500.woff2" — VERIFY/self-host before relying on it
    format: "woff2" as const,
    weight: 500,
    style: "normal" as const,
  },

  /** Spacing scale (px) — used for margins/padding so rhythm stays consistent. */
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  fontSize: {
    caption: 12,
    small: 13,
    label: 11,
    body: 16,
    heading: 27,
    wordmark: 19,
  },

  radius: {
    card: 14,
    panel: 12,
    button: 10,
  },

  /** Outer email width. 600px is the email-client-safe maximum. */
  maxWidth: 600,
} as const;

export type Theme = typeof theme;
