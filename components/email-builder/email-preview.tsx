"use client";

import * as React from "react";

import type { EmailLayout } from "@/lib/email/layout";

/**
 * A faithful, client-side visual of the daily email — the live preview in the
 * builder. It mirrors the engine's render-email.ts (api/, standalone) using the
 * same dawn palette, so the subscriber sees what they'll get without a round-trip
 * for every layout change. AI slots show their generated text when available
 * (after "Preview with AI"), or a placeholder otherwise. "feed" text never
 * appears here — like the real email, the model consumed it.
 */

const C = {
  page: "#f6ecdd",
  card: "#fffdf9",
  border: "#e9dcc6",
  ink: "#2a2118",
  inkSoft: "#6f6353",
  accent: "#b6651a",
  noteBg: "#fdf3e0",
  dawn: "linear-gradient(90deg, #241b40 0%, #3a2a4d 30%, #f5a623 70%, #ffd27a 100%)",
};
const FONT_DISPLAY = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const TONE_LABELS: Record<string, string> = {
  gentle: "Gentle",
  direct: "Direct",
  playful: "Playful",
  stoic: "Stoic",
};
const THEME_LABELS: Record<string, string> = {
  gratitude: "Gratitude",
  momentum: "Momentum",
  identity: "Identity",
  small_wins: "Small wins",
  resistance: "Resistance",
  reflection: "Reflection",
};

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

interface EmailPreviewProps {
  layout: EmailLayout;
  /** AI content per slot id (from a generation). Partial/empty is fine. */
  sections: Record<string, string>;
  subject: string;
  tone: string;
  theme: string;
  productName?: string;
}

export function EmailPreview({
  layout,
  sections,
  subject,
  tone,
  theme,
  productName = "Daybreak",
}: EmailPreviewProps) {
  const hasHeader = layout.sections.some((s) => s.kind === "chrome" && s.role === "header");
  const hasFooter = layout.sections.some((s) => s.kind === "chrome" && s.role === "footer");

  return (
    <div style={{ backgroundColor: C.page, padding: "20px 14px", borderRadius: 12 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {hasHeader && (
          <div
            style={{
              height: 6,
              backgroundImage: C.dawn,
              borderRadius: "12px 12px 0 0",
            }}
          />
        )}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderTop: hasHeader ? 0 : `1px solid ${C.border}`,
            borderRadius: hasHeader ? "0 0 12px 12px" : 12,
            padding: "26px 28px 22px",
          }}
        >
          {layout.sections.map((section) => (
            <Block
              key={blockKey(section)}
              section={section}
              sections={sections}
              subject={subject}
              tone={tone}
              theme={theme}
              productName={productName}
            />
          ))}
        </div>
        {hasFooter && (
          <div
            style={{
              textAlign: "center",
              padding: "16px 10px 0",
              fontFamily: FONT_SANS,
              fontSize: 11,
              lineHeight: 1.7,
              color: C.inkSoft,
            }}
          >
            <p style={{ margin: "0 0 4px" }}>
              A fresh, personal nudge in your inbox every morning.
            </p>
            <p style={{ margin: 0 }}>
              You&rsquo;re receiving this because you asked for one good morning email a day.{" "}
              <span style={{ color: C.accent }}>Unsubscribe</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function blockKey(section: EmailLayout["sections"][number]): string {
  if (section.kind === "chrome") return `chrome:${section.role}`;
  return `${section.kind}:${section.id}`;
}

function Block({
  section,
  sections,
  subject,
  tone,
  theme,
  productName,
}: {
  section: EmailLayout["sections"][number];
  sections: Record<string, string>;
  subject: string;
  tone: string;
  theme: string;
  productName: string;
}): React.ReactNode {
  switch (section.kind) {
    case "chrome":
      return (
        <ChromeBlock
          role={section.role}
          subject={subject}
          tone={tone}
          theme={theme}
          productName={productName}
        />
      );
    case "text":
      if (section.handling !== "verbatim") return null; // feed text isn't shown
      return (
        <div
          style={{
            backgroundColor: C.noteBg,
            borderLeft: `3px solid ${C.accent}`,
            borderRadius: "0 8px 8px 0",
            padding: "14px 18px",
            margin: "8px 0 22px",
          }}
        >
          {section.label && (
            <p
              style={{
                margin: "0 0 6px",
                fontFamily: FONT_SANS,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              {section.label}
            </p>
          )}
          <p
            style={{
              margin: 0,
              fontFamily: FONT_DISPLAY,
              fontSize: 15,
              fontStyle: "italic",
              lineHeight: 1.6,
              color: C.ink,
              whiteSpace: "pre-wrap",
            }}
          >
            {section.text || "Your text…"}
          </p>
        </div>
      );
    case "ai": {
      const content = sections[section.id]?.trim();
      if (!content) {
        return (
          <div
            style={{
              border: `1px dashed ${C.border}`,
              borderRadius: 8,
              padding: "14px 16px",
              margin: "0 0 16px",
              fontFamily: FONT_SANS,
              fontSize: 13,
              fontStyle: "italic",
              color: C.inkSoft,
            }}
          >
            Your daily message appears here — click &ldquo;Preview with AI&rdquo; to fill it.
          </div>
        );
      }
      return (
        <>
          {paragraphs(content).map((p, i) => (
            <p
              key={i}
              style={{
                margin: "0 0 16px",
                fontFamily: FONT_SANS,
                fontSize: 15,
                lineHeight: 1.65,
                color: C.ink,
                whiteSpace: "pre-wrap",
              }}
            >
              {p}
            </p>
          ))}
        </>
      );
    }
  }
}

function ChromeBlock({
  role,
  subject,
  tone,
  theme,
  productName,
}: {
  role: "header" | "heading" | "signature" | "meta" | "footer";
  subject: string;
  tone: string;
  theme: string;
  productName: string;
}): React.ReactNode {
  switch (role) {
    case "header":
      return (
        <p style={{ margin: "0 0 22px" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink }}>
            ☀︎&nbsp; {productName}
          </span>
        </p>
      );
    case "heading":
      return (
        <h1
          style={{
            margin: "0 0 18px",
            fontFamily: FONT_DISPLAY,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.25,
            color: C.ink,
          }}
        >
          {subject || "Your subject appears here"}
        </h1>
      );
    case "signature":
      return (
        <p style={{ margin: "0 0 22px", fontFamily: FONT_SANS, fontSize: 15, color: C.inkSoft }}>
          — {productName}
        </p>
      );
    case "meta":
      return (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 12,
            fontFamily: FONT_SANS,
            fontSize: 11,
            color: C.inkSoft,
          }}
        >
          <span style={{ color: C.accent }}>•</span> Tone: {TONE_LABELS[tone] ?? tone}
          &nbsp;&nbsp;
          <span style={{ color: C.accent }}>•</span> Today&rsquo;s theme:{" "}
          {THEME_LABELS[theme] ?? theme}
        </div>
      );
    case "footer":
      return null; // rendered by the frame
  }
}
