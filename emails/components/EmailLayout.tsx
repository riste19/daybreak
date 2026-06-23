import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import * as React from "react";

import { theme } from "../theme";
import { Footer, type FooterProps } from "./Footer";
import { Header } from "./Header";

/**
 * The outer shell every template renders into: Html → Head (+ fonts) → Body
 * (cream page) → Container (the 600px card) with the shared Header on top and
 * shared Footer below. Templates supply their own `preview` preheader and the
 * footer config; everything in between is the template's body.
 */
export interface EmailLayoutProps {
  /**
   * The inbox preheader — controlled per template, never auto-grabbed from body
   * text. Keep it short (~90 chars) and distinct from the opening line.
   */
  preview: string;
  /** Footer state + links (CTA + legal copy vary by variant). */
  footer: FooterProps;
  /** Show the thin dawn-gradient bar at the top of the card. Default true. */
  gradient?: boolean;
  children: React.ReactNode;
}

const { color, font, displayWebFont } = theme;

export function EmailLayout({
  preview,
  footer,
  gradient = true,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        {/* Declare the display family with a Georgia fallback. The webfont is
            only loaded when displayWebFont.url is set (it renders in Apple/iOS
            Mail; everyone else gets Georgia — see theme.ts). */}
        <Font
          fontFamily={displayWebFont.family}
          fallbackFontFamily={["Georgia", "Times New Roman", "serif"]}
          fontWeight={displayWebFont.weight}
          fontStyle={displayWebFont.style}
          {...(displayWebFont.url
            ? { webFont: { url: displayWebFont.url, format: displayWebFont.format } }
            : {})}
        />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>

      {/* Controlled preheader — distinct per template. */}
      <Preview>{preview}</Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: color.page,
          fontFamily: font.body,
        }}
      >
        <Container
          style={{
            maxWidth: theme.maxWidth,
            width: "100%",
            padding: "32px 16px",
          }}
        >
          {/* The card. The gradient bar (in Header) caps its top; the body
              sections sit inside the same bordered, rounded surface. */}
          <Section
            style={{
              backgroundColor: color.card,
              border: `1px solid ${color.border}`,
              borderRadius: theme.radius.card,
            }}
          >
            <Header gradient={gradient} />
            <Section style={{ padding: "8px 36px 28px" }}>{children}</Section>
          </Section>

          <Footer {...footer} />
        </Container>
      </Body>
    </Html>
  );
}
