import { Hr, Link, Section, Text } from "@react-email/components";
import * as React from "react";

import { links, tagline } from "../config";
import { theme } from "../theme";
import { CTAButton } from "./CTAButton";

/**
 * The shared footer. Its CTA and legal line vary by `variant`:
 *   • sample — a prominent "Start your 7-day free trial →" button (the recipient
 *     isn't subscribed yet).
 *   • trial  — a calm "Manage your preferences →" link (no hard sell).
 *   • paid   — an inline row: Manage preferences · Change tone · Unsubscribe.
 *
 * The unsubscribe link is ALWAYS rendered and must be a working URL. `ctaText`
 * / `ctaUrl` override the per-variant default when a caller needs something
 * specific (e.g. a tokenised manage link).
 */
export type FooterVariant = "trial" | "paid" | "sample";

export interface FooterProps {
  variant: FooterVariant;
  /** Required, working unsubscribe URL (the same one used in List-Unsubscribe). */
  unsubscribeUrl: string;
  /** Account/preferences link for trial + paid footers. */
  manageUrl?: string;
  /** "Change tone" target for the paid footer. */
  changeToneUrl?: string;
  /** Override the default CTA label for this variant. */
  ctaText?: string;
  /** Override the default CTA target for this variant. */
  ctaUrl?: string;
}

const { color, font, fontSize, space } = theme;

const captionStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: font.body,
  fontSize: fontSize.caption,
  lineHeight: "1.7",
  color: color.inkSoft,
};

const linkStyle: React.CSSProperties = { color: color.accent, textDecoration: "none" };

/** The reason-for-receiving line, per lifecycle state. */
function legalLine(variant: FooterVariant): string {
  switch (variant) {
    case "sample":
      return "You received this sample because you asked to see what a Daybreak morning feels like.";
    case "trial":
      return "You're receiving this during your free trial — one good morning email a day.";
    case "paid":
      return "You're receiving Daybreak because you subscribed. Thanks for being here.";
  }
}

export function Footer({
  variant,
  unsubscribeUrl,
  manageUrl = links.manage,
  changeToneUrl = links.preferences,
  ctaText,
  ctaUrl,
}: FooterProps) {
  return (
    <Section style={{ padding: "20px 12px 0", textAlign: "center" }}>
      {/* Per-variant CTA */}
      {variant === "sample" ? (
        <Section style={{ paddingBottom: space.md }}>
          <CTAButton
            label={ctaText ?? "Start your 7-day free trial →"}
            href={ctaUrl ?? links.subscribe}
          />
        </Section>
      ) : null}

      {variant === "trial" ? (
        <Text style={{ ...captionStyle, marginBottom: space.sm }}>
          <Link href={ctaUrl ?? manageUrl} style={{ ...linkStyle, fontWeight: 600 }}>
            {ctaText ?? "Manage your preferences →"}
          </Link>
        </Text>
      ) : null}

      {variant === "paid" ? (
        <Text style={{ ...captionStyle, marginBottom: space.sm }}>
          <Link href={manageUrl} style={linkStyle}>
            Manage preferences
          </Link>
          {"  ·  "}
          <Link href={changeToneUrl} style={linkStyle}>
            Change tone
          </Link>
          {"  ·  "}
          <Link href={unsubscribeUrl} style={linkStyle}>
            Unsubscribe
          </Link>
        </Text>
      ) : null}

      <Hr
        style={{
          border: "none",
          borderTop: `1px solid ${color.border}`,
          margin: `${space.md}px auto`,
          width: "60px",
        }}
      />

      <Text style={{ ...captionStyle, marginBottom: space.xs }}>{tagline}</Text>
      <Text style={captionStyle}>
        {legalLine(variant)}
        {/* The unsubscribe link is always present. The paid variant already shows
            one inline above, so we don't repeat it there. */}
        {variant !== "paid" ? (
          <>
            {"  "}
            <Link href={unsubscribeUrl} style={linkStyle}>
              Unsubscribe
            </Link>
          </>
        ) : null}
      </Text>
    </Section>
  );
}
