import type { Theme, Tone } from "../../generation/domain/types";

/**
 * The daily-email template — a pure renderer: data in, `{ html, text }` out.
 * No I/O, no provider knowledge, fully unit-testable.
 *
 * Design notes
 *  - Mirrors the landing page's dawn world (app/globals.css + the SampleEmail
 *    section): cream page, white card, warm ink text, amber accents, a dawn
 *    gradient strip where night meets gold, serif display headings (Fraunces
 *    on the web → Georgia in email, where webfonts are unreliable).
 *  - Email-client-safe: single 600px table, inline styles only, no flexbox/grid,
 *    bgcolor fallbacks behind every gradient. Renders in Gmail/Outlook/Apple Mail.
 *  - Customizable: everything brand-shaped lives in EmailBranding with Daybreak
 *    defaults — a future premium tier can override colors, labels, or footer
 *    per subscriber without touching the layout.
 *  - `personalNote` is the premium "static text" feature: words the subscriber
 *    wrote for themselves, rendered verbatim in a distinct block. It is template
 *    data ONLY — by design it never enters the LLM prompt (see DeliveryService).
 *
 * Every interpolated value is HTML-escaped. The LLM body is already validated
 * to contain no markup (validateOutput), but the template does not rely on that.
 */

/* ───────────────────────────── Branding ─────────────────────────────── */

export interface EmailBranding {
  productName: string;
  tagline: string;
  /** Linked from the wordmark and footer. */
  url: string;
  /** Heading over the subscriber's own static text block. */
  personalNoteLabel: string;
  /** Footer line explaining why the email arrived. */
  footerNote: string;
  /** Unsubscribe target; rendered as the last footer link. */
  unsubscribeUrl: string;
  colors: {
    /** Page background behind the card. */
    page: string;
    /** Card surface. */
    card: string;
    /** Hairline borders. */
    border: string;
    /** Primary text. */
    ink: string;
    /** Muted text. */
    inkSoft: string;
    /** Warm accent (links, label, dots). */
    accent: string;
    /** Tinted panel behind the personal note. */
    noteBackground: string;
    /** Dawn gradient stops for the top strip (night → gold). */
    dawn: [string, string, string, string];
  };
}

/** Daybreak defaults — token values lifted from app/globals.css. */
export const DEFAULT_BRANDING: EmailBranding = {
  productName: "Daybreak",
  tagline: "A fresh, personal nudge in your inbox every morning.",
  url: "https://daybreak.email",
  personalNoteLabel: "A note from you",
  footerNote: "You're receiving this because you asked for one good morning email a day.",
  unsubscribeUrl: "https://daybreak.email/unsubscribe",
  colors: {
    page: "#f6ecdd", // cream-deep
    card: "#fffdf9",
    border: "#e9dcc6",
    ink: "#2a2118",
    inkSoft: "#6f6353",
    accent: "#b6651a", // primary — accessible amber-brown on cream
    noteBackground: "#fdf3e0",
    dawn: ["#241b40", "#3a2a4d", "#f5a623", "#ffd27a"], // twilight → horizon → amber → gold
  },
};

/* ────────────────────────────── Input ───────────────────────────────── */

export interface DailyEmailTemplateInput {
  subject: string;
  /** Plain-text body from the generation engine; blank lines split paragraphs. */
  body: string;
  tone: Tone;
  theme: Theme;
  /** Premium static text — already screened by the caller, never LLM-touched. */
  personalNote?: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

/* ───────────────────────────── Helpers ──────────────────────────────── */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Split engine output into paragraphs: blank-line separated, single \n kept as breaks. */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

const THEME_LABELS: Record<Theme, string> = {
  gratitude: "Gratitude",
  momentum: "Momentum",
  identity: "Identity",
  small_wins: "Small wins",
  resistance: "Resistance",
  reflection: "Reflection",
};

const TONE_LABELS: Record<Tone, string> = {
  gentle: "Gentle",
  direct: "Direct",
  playful: "Playful",
  stoic: "Stoic",
};

const FONT_SANS =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_DISPLAY = "Georgia, 'Times New Roman', serif";

/* ───────────────────────────── Renderer ─────────────────────────────── */

export function renderDailyEmail(
  input: DailyEmailTemplateInput,
  brandingOverrides: Partial<EmailBranding> = {},
): RenderedEmail {
  const brand: EmailBranding = {
    ...DEFAULT_BRANDING,
    ...brandingOverrides,
    colors: { ...DEFAULT_BRANDING.colors, ...brandingOverrides.colors },
  };
  const c = brand.colors;
  const paragraphs = toParagraphs(input.body);
  const toneLabel = TONE_LABELS[input.tone];
  const themeLabel = THEME_LABELS[input.theme];

  const paragraphHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px; font-family:${FONT_SANS}; font-size:16px; line-height:1.65; color:${c.ink};">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");

  const noteHtml = input.personalNote
    ? `
            <!-- Personal note: the subscriber's own static words, rendered verbatim -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
              <tr>
                <td style="background-color:${c.noteBackground}; border-left:3px solid ${c.accent}; border-radius:0 10px 10px 0; padding:16px 20px;">
                  <p style="margin:0 0 6px; font-family:${FONT_SANS}; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${c.accent};">${escapeHtml(brand.personalNoteLabel)}</p>
                  <p style="margin:0; font-family:${FONT_DISPLAY}; font-size:16px; font-style:italic; line-height:1.6; color:${c.ink};">${escapeHtml(input.personalNote).replace(/\n/g, "<br />")}</p>
                </td>
              </tr>
            </table>`
    : "";

  const dot = `<span style="color:${c.accent};">&bull;</span>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:${c.page};">
  <!-- Preheader: inbox preview text, invisible in the email itself -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(firstSentence(paragraphs))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Dawn strip: night warming into gold, the brand's signature gradient -->
          <tr>
            <td height="6" bgcolor="${c.dawn[2]}" style="border-radius:14px 14px 0 0; background-image:linear-gradient(90deg, ${c.dawn[0]} 0%, ${c.dawn[1]} 30%, ${c.dawn[2]} 70%, ${c.dawn[3]} 100%); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="${c.card}" style="background-color:${c.card}; border:1px solid ${c.border}; border-top:0; border-radius:0 0 14px 14px; padding:32px 36px 28px;">

              <!-- Wordmark -->
              <p style="margin:0 0 28px;">
                <a href="${escapeHtml(brand.url)}" style="font-family:${FONT_DISPLAY}; font-size:19px; font-weight:600; color:${c.ink}; text-decoration:none;">&#9728;&#xFE0E;&nbsp; ${escapeHtml(brand.productName)}</a>
              </p>

              <!-- Subject as the display heading -->
              <h1 style="margin:0 0 20px; font-family:${FONT_DISPLAY}; font-size:27px; font-weight:500; line-height:1.25; color:${c.ink};">${escapeHtml(input.subject)}</h1>

${paragraphHtml}
${noteHtml}
              <p style="margin:0 0 28px; font-family:${FONT_SANS}; font-size:16px; color:${c.inkSoft};">&mdash; ${escapeHtml(brand.productName)}</p>

              <!-- Meta strip: how today's email was shaped -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${c.border}; padding-top:14px; font-family:${FONT_SANS}; font-size:12px; color:${c.inkSoft};">
                    ${dot} Tone: ${escapeHtml(toneLabel)} &nbsp;&nbsp;${dot} Today&rsquo;s theme: ${escapeHtml(themeLabel)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 12px 0; text-align:center; font-family:${FONT_SANS}; font-size:12px; line-height:1.7; color:${c.inkSoft};">
              <p style="margin:0 0 4px;">${escapeHtml(brand.tagline)}</p>
              <p style="margin:0;">${escapeHtml(brand.footerNote)}
                &nbsp;<a href="${escapeHtml(brand.unsubscribeUrl)}" style="color:${c.accent};">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    `${brand.productName} — ${input.subject}`,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
  ];
  if (input.personalNote) {
    textLines.push(`-- ${brand.personalNoteLabel} --`, input.personalNote, "");
  }
  textLines.push(
    `— ${brand.productName}`,
    "",
    `Tone: ${toneLabel} · Today's theme: ${themeLabel}`,
    "",
    brand.footerNote,
    `Unsubscribe: ${brand.unsubscribeUrl}`,
  );

  return { html, text: textLines.join("\n") };
}

/** First sentence of the first paragraph, for the inbox preheader. */
function firstSentence(paragraphs: string[]): string {
  const first = paragraphs[0] ?? "";
  const match = first.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : first).trim().slice(0, 140);
}
