import type { Theme, Tone } from "../../generation/domain/types";
import type { EmailLayout, EmailSection, TextSection } from "../domain/layout";
import { DEFAULT_LAYOUT } from "../domain/layout";

/**
 * The daily-email template — a pure renderer: data in, `{ html, text }` out.
 * No I/O, no provider knowledge, fully unit-testable.
 *
 * Layout-driven: the email is an ORDERED stack of sections (the subscriber's
 * mutable preference — see ../domain/layout). The renderer walks the layout and
 * emits each block:
 *  - chrome header  → dawn strip + wordmark   chrome heading → subject heading
 *  - chrome signature/meta/footer → the framing lines
 *  - text (verbatim) → the subscriber's own words, escaped, in a tinted block
 *  - ai → that slot's generated content (from result.sections[id]), as paragraphs
 * `text` blocks with handling "feed" are NOT rendered here (they were consumed by
 * the model); only "verbatim" text reaches the template.
 *
 * Design notes
 *  - Mirrors the landing page's dawn world: cream page, white card, warm ink,
 *    amber accents, a dawn gradient strip, serif display headings (Georgia in
 *    email, where webfonts are unreliable).
 *  - Email-client-safe: single 600px table, inline styles only, no flexbox/grid,
 *    bgcolor fallbacks behind every gradient. Renders in Gmail/Outlook/Apple Mail.
 *  - Customizable: everything brand-shaped lives in EmailBranding with Daybreak
 *    defaults — a premium tier can override colors, labels, or footer per
 *    subscriber without touching the layout.
 *
 * Every interpolated value is HTML-escaped. The LLM body is already validated to
 * contain no markup (validateOutput), but the template does not rely on that.
 */

/* ───────────────────────────── Branding ─────────────────────────────── */

export interface EmailBranding {
  productName: string;
  tagline: string;
  /** Linked from the wordmark and footer. */
  url: string;
  /** Default heading over a verbatim block that carries no explicit label. */
  personalNoteLabel: string;
  /** Footer line explaining why the email arrived. */
  footerNote: string;
  /** Unsubscribe target; rendered as the last footer link. */
  unsubscribeUrl: string;
  /**
   * Optional "go daily" nudge rendered just above the footer — a calm pointer to
   * the subscription page. Set to `null` to hide it (e.g. for paid subscribers).
   * Only shown when the layout includes a footer, so it travels with the frame.
   */
  upgrade: {
    /** Short line above the link. */
    note: string;
    /** Link label (an arrow is appended by the template). */
    label: string;
    /** Subscription / pricing page. */
    url: string;
  } | null;
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
    /** Tinted panel behind verbatim text blocks. */
    noteBackground: string;
    /** Dawn gradient stops for the top strip (night → gold). */
    dawn: [string, string, string, string];
  };
}

/** Daybreak defaults — token values lifted from app/globals.css. */
export const DEFAULT_BRANDING: EmailBranding = {
  productName: "Daybreak",
  tagline: "A fresh, personal nudge in your inbox every morning.",
  url: "https://localhost:3000",
  personalNoteLabel: "A note from you",
  footerNote: "You're receiving this because you asked for one good morning email a day.",
  unsubscribeUrl: "https://localhost:3000/unsubscribe",
  upgrade: {
    note: "Loving your mornings? Make them daily — your time, your tone, your own email layout.",
    label: "Go daily",
    url: "https://localhost:3000/subscribe",
  },
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
  /** Generated content per AI slot id (from GenerationResult.sections). */
  sections: Record<string, string>;
  tone: Tone;
  theme: Theme;
  /** The ordered section list. Defaults to the canonical layout. */
  layout?: EmailLayout;
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

/** Split body text into paragraphs: blank-line separated, single \n kept as breaks. */
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

/* ───────────────────────── Block renderers (HTML) ────────────────────── */

function wordmarkHtml(brand: EmailBranding): string {
  const c = brand.colors;
  return `              <!-- Wordmark -->
              <p style="margin:0 0 28px;">
                <a href="${escapeHtml(brand.url)}" style="font-family:${FONT_DISPLAY}; font-size:19px; font-weight:600; color:${c.ink}; text-decoration:none;">&#9728;&#xFE0E;&nbsp; ${escapeHtml(brand.productName)}</a>
              </p>`;
}

function headingHtml(subject: string, c: EmailBranding["colors"]): string {
  return `              <!-- Subject as the display heading -->
              <h1 style="margin:0 0 20px; font-family:${FONT_DISPLAY}; font-size:27px; font-weight:500; line-height:1.25; color:${c.ink};">${escapeHtml(subject)}</h1>`;
}

function aiBlockHtml(content: string, c: EmailBranding["colors"]): string {
  const paragraphs = toParagraphs(content);
  if (paragraphs.length === 0) return "";
  return paragraphs
    .map(
      (p) =>
        `              <p style="margin:0 0 16px; font-family:${FONT_SANS}; font-size:16px; line-height:1.65; color:${c.ink};">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");
}

function verbatimBlockHtml(
  section: TextSection,
  brand: EmailBranding,
): string {
  const c = brand.colors;
  const labelHtml = section.label
    ? `\n                  <p style="margin:0 0 6px; font-family:${FONT_SANS}; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${c.accent};">${escapeHtml(section.label)}</p>`
    : "";
  return `              <!-- Verbatim text: the subscriber's own words, rendered as typed -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="background-color:${c.noteBackground}; border-left:3px solid ${c.accent}; border-radius:0 10px 10px 0; padding:16px 20px;">${labelHtml}
                  <p style="margin:0; font-family:${FONT_DISPLAY}; font-size:16px; font-style:italic; line-height:1.6; color:${c.ink};">${escapeHtml(section.text).replace(/\n/g, "<br />")}</p>
                </td>
              </tr>
            </table>`;
}

function signatureHtml(brand: EmailBranding): string {
  const c = brand.colors;
  return `              <p style="margin:0 0 28px; font-family:${FONT_SANS}; font-size:16px; color:${c.inkSoft};">&mdash; ${escapeHtml(brand.productName)}</p>`;
}

function upgradeHtml(brand: EmailBranding): string {
  if (!brand.upgrade) return "";
  const c = brand.colors;
  const u = brand.upgrade;
  return `
          <!-- Upgrade nudge: a calm pointer to the subscription page -->
          <tr>
            <td style="padding:18px 12px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:${c.noteBackground}; border:1px solid ${c.border}; border-radius:12px; padding:18px 22px;">
                    <p style="margin:0 0 10px; font-family:${FONT_SANS}; font-size:13px; line-height:1.6; color:${c.inkSoft};">${escapeHtml(u.note)}</p>
                    <a href="${escapeHtml(u.url)}" style="font-family:${FONT_SANS}; font-size:13px; font-weight:700; color:${c.accent}; text-decoration:none;">${escapeHtml(u.label)} &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;
}

function metaHtml(
  toneLabel: string,
  themeLabel: string,
  c: EmailBranding["colors"],
): string {
  const dot = `<span style="color:${c.accent};">&bull;</span>`;
  return `              <!-- Meta strip: how today's email was shaped -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${c.border}; padding-top:14px; font-family:${FONT_SANS}; font-size:12px; color:${c.inkSoft};">
                    ${dot} Tone: ${escapeHtml(toneLabel)} &nbsp;&nbsp;${dot} Today&rsquo;s theme: ${escapeHtml(themeLabel)}
                  </td>
                </tr>
              </table>`;
}

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
  const sections = (input.layout ?? DEFAULT_LAYOUT).sections;
  const toneLabel = TONE_LABELS[input.tone];
  const themeLabel = THEME_LABELS[input.theme];

  // Walk the layout once → in-card HTML blocks + header/footer frame flags.
  let hasHeader = false;
  let hasFooter = false;
  const cardBlocks: string[] = [];

  for (const section of sections) {
    const html = renderSectionHtml(section, input, brand, toneLabel, themeLabel);
    if (section.kind === "chrome" && section.role === "header") hasHeader = true;
    if (section.kind === "chrome" && section.role === "footer") {
      hasFooter = true;
      continue; // footer renders outside the card, below.
    }
    if (html) cardBlocks.push(html);
  }

  // Preheader: first sentence of the first AI slot's content.
  const firstAi = sections.find((s): s is Extract<EmailSection, { kind: "ai" }> => s.kind === "ai");
  const preheaderParas = firstAi ? toParagraphs(input.sections[firstAi.id] ?? "") : [];

  const dawnStrip = hasHeader
    ? `
          <!-- Dawn strip: night warming into gold, the brand's signature gradient -->
          <tr>
            <td height="6" bgcolor="${c.dawn[2]}" style="border-radius:14px 14px 0 0; background-image:linear-gradient(90deg, ${c.dawn[0]} 0%, ${c.dawn[1]} 30%, ${c.dawn[2]} 70%, ${c.dawn[3]} 100%); font-size:0; line-height:0;">&nbsp;</td>
          </tr>
`
    : "";

  // With the dawn strip, the card's top corners are square and the top border is
  // dropped (the strip caps it); without it, the card is fully rounded + bordered.
  const cardStyle = hasHeader
    ? `background-color:${c.card}; border:1px solid ${c.border}; border-top:0; border-radius:0 0 14px 14px; padding:32px 36px 28px;`
    : `background-color:${c.card}; border:1px solid ${c.border}; border-radius:14px; padding:32px 36px 28px;`;

  // The upgrade nudge travels with the footer frame (skipped when there's no
  // footer, or when branding sets `upgrade: null`).
  const upgrade = hasFooter ? upgradeHtml(brand) : "";

  const footer = hasFooter
    ? `
          <!-- Footer -->
          <tr>
            <td style="padding:20px 12px 0; text-align:center; font-family:${FONT_SANS}; font-size:12px; line-height:1.7; color:${c.inkSoft};">
              <p style="margin:0 0 4px;">${escapeHtml(brand.tagline)}</p>
              <p style="margin:0;">${escapeHtml(brand.footerNote)}
                &nbsp;<a href="${escapeHtml(brand.unsubscribeUrl)}" style="color:${c.accent};">Unsubscribe</a></p>
            </td>
          </tr>
`
    : "";

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
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(firstSentence(preheaderParas))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
${dawnStrip}
          <!-- Card -->
          <tr>
            <td bgcolor="${c.card}" style="${cardStyle}">

${cardBlocks.join("\n")}
            </td>
          </tr>
${upgrade}${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: renderText(input, brand, sections, toneLabel, themeLabel) };
}

function renderSectionHtml(
  section: EmailSection,
  input: DailyEmailTemplateInput,
  brand: EmailBranding,
  toneLabel: string,
  themeLabel: string,
): string {
  const c = brand.colors;
  switch (section.kind) {
    case "chrome":
      switch (section.role) {
        case "header":
          return wordmarkHtml(brand);
        case "heading":
          return headingHtml(input.subject, c);
        case "signature":
          return signatureHtml(brand);
        case "meta":
          return metaHtml(toneLabel, themeLabel, c);
        case "footer":
          return ""; // handled by the frame
      }
      return "";
    case "text":
      return section.handling === "verbatim" ? verbatimBlockHtml(section, brand) : "";
    case "ai":
      return aiBlockHtml(input.sections[section.id] ?? "", c);
  }
}

/* ─────────────────────────── Plain-text twin ─────────────────────────── */

function renderText(
  input: DailyEmailTemplateInput,
  brand: EmailBranding,
  sections: EmailSection[],
  toneLabel: string,
  themeLabel: string,
): string {
  const lines: string[] = [];
  let wroteHeading = false;

  for (const section of sections) {
    switch (section.kind) {
      case "chrome":
        if (section.role === "header") {
          lines.push(brand.productName, "");
        } else if (section.role === "heading") {
          lines.push(input.subject, "");
          wroteHeading = true;
        } else if (section.role === "signature") {
          lines.push(`— ${brand.productName}`, "");
        } else if (section.role === "meta") {
          lines.push(`Tone: ${toneLabel} · Today's theme: ${themeLabel}`, "");
        } else if (section.role === "footer") {
          if (brand.upgrade) {
            lines.push(brand.upgrade.note, `${brand.upgrade.label}: ${brand.upgrade.url}`, "");
          }
          lines.push(brand.footerNote, `Unsubscribe: ${brand.unsubscribeUrl}`);
        }
        break;
      case "text":
        if (section.handling === "verbatim") {
          if (section.label) lines.push(`-- ${section.label} --`);
          lines.push(section.text, "");
        }
        break;
      case "ai":
        for (const p of toParagraphs(input.sections[section.id] ?? "")) {
          lines.push(p, "");
        }
        break;
    }
  }

  // Mirror the old "Product — Subject" header line when no explicit heading ran.
  if (!wroteHeading) lines.unshift(`${brand.productName} — ${input.subject}`, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/** First sentence of the first paragraph, for the inbox preheader. */
function firstSentence(paragraphs: string[]): string {
  const first = paragraphs[0] ?? "";
  const match = first.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : first).trim().slice(0, 140);
}
