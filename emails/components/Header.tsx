import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { LOGO_URL, links } from "../config";
import { theme } from "../theme";

/**
 * The shared Daybreak header: an optional thin dawn-gradient bar across the very
 * top of the card, then the logo lockup — a small sunburst mark beside the
 * "Daybreak" wordmark. The mark is a hosted <Img> when LOGO_URL is set, else a
 * text sun glyph (☀) so the header renders with zero assets.
 */
export interface HeaderProps {
  /** Show the thin sunrise-gradient bar above the wordmark. Default true. */
  gradient?: boolean;
}

const { color, font, fontSize } = theme;

function GradientBar() {
  const [a, b, c, d] = color.dawn;
  return (
    <Section
      style={{
        // bgcolor fallback (Outlook ignores gradients) + the gradient itself.
        backgroundColor: c,
        backgroundImage: `linear-gradient(90deg, ${a} 0%, ${b} 30%, ${c} 70%, ${d} 100%)`,
        height: "5px",
        lineHeight: "5px",
        fontSize: "1px",
        borderTopLeftRadius: theme.radius.card,
        borderTopRightRadius: theme.radius.card,
      }}
    >
      &nbsp;
    </Section>
  );
}

export function Header({ gradient = true }: HeaderProps) {
  return (
    <>
      {gradient ? <GradientBar /> : null}
      <Section style={{ padding: "28px 36px 0" }}>
        <Row>
          <Column style={{ width: "30px", verticalAlign: "middle" }}>
            {LOGO_URL ? (
              <Img
                src={LOGO_URL}
                width="22"
                height="22"
                alt="Daybreak"
                style={{ display: "block" }}
              />
            ) : (
              <Text
                style={{
                  margin: 0,
                  fontSize: "20px",
                  lineHeight: "22px",
                  color: color.accent,
                }}
              >
                {/* ☀ sunburst glyph, text-presentation so it stays mono-colour */}
                {"☀︎"}
              </Text>
            )}
          </Column>
          <Column style={{ verticalAlign: "middle" }}>
            <Link
              href={links.site}
              style={{
                fontFamily: font.display,
                fontSize: fontSize.wordmark,
                fontWeight: 600,
                color: color.ink,
                textDecoration: "none",
              }}
            >
              Daybreak
            </Link>
          </Column>
        </Row>
      </Section>
    </>
  );
}
