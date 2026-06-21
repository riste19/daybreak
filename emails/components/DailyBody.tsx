import { Heading, Hr, Text } from "@react-email/components";
import * as React from "react";

import { theme } from "../theme";

/**
 * The shared daily-email body: subject heading → the AI-generated paragraphs →
 * "— Daybreak" signature → the tone/theme meta caption, with an optional subtle
 * note line (e.g. trial day count). Sample / Trial / Paid all render this, so the
 * three states share one body and differ only in their footer + preheader.
 *
 * The motivational copy is NEVER hardcoded — `bodyParagraphs` is passed in
 * (AI-generated upstream) and rendered as-is, one <Text> per paragraph.
 */
export interface DailyBodyProps {
  subject: string;
  /** AI-generated paragraphs. Rendered verbatim, in order. */
  bodyParagraphs: string[];
  /** Display tone, e.g. "gentle" → "Gentle". */
  tone: string;
  /** Display theme of the day, e.g. "reflection" → "Reflection". */
  themeOfDay: string;
  /** Optional subtle line under the meta caption (e.g. "Day 3 of 7 in your free trial."). */
  note?: string;
}

const { color, font, fontSize, space } = theme;

/** "small_wins" → "Small wins"; "gentle" → "Gentle". */
function humanize(value: string): string {
  const spaced = value.replace(/[_\s]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : spaced;
}

export function DailyBody({
  subject,
  bodyParagraphs,
  tone,
  themeOfDay,
  note,
}: DailyBodyProps) {
  return (
    <>
      <Heading
        as="h1"
        style={{
          margin: `0 0 ${space.lg}px`,
          fontFamily: font.display,
          fontSize: fontSize.heading,
          fontWeight: 500,
          lineHeight: 1.25,
          color: color.ink,
        }}
      >
        {subject}
      </Heading>

      {bodyParagraphs.map((paragraph, i) => (
        <Text
          key={i}
          style={{
            margin: `0 0 ${space.md}px`,
            fontFamily: font.body,
            fontSize: fontSize.body,
            lineHeight: 1.65,
            color: color.ink,
          }}
        >
          {paragraph}
        </Text>
      ))}

      <Text
        style={{
          margin: `${space.sm}px 0 ${space.lg}px`,
          fontFamily: font.body,
          fontSize: fontSize.body,
          color: color.inkSoft,
        }}
      >
        — Daybreak
      </Text>

      <Hr
        style={{
          border: "none",
          borderTop: `1px solid ${color.border}`,
          margin: 0,
        }}
      />
      <Text
        style={{
          margin: `${space.md}px 0 0`,
          fontFamily: font.body,
          fontSize: fontSize.caption,
          color: color.inkSoft,
        }}
      >
        <span style={{ color: color.accent }}>•</span> Tone: {humanize(tone)}
        {"   "}
        <span style={{ color: color.accent }}>•</span> Today&rsquo;s theme:{" "}
        {humanize(themeOfDay)}
      </Text>

      {note ? (
        <Text
          style={{
            margin: `${space.sm}px 0 0`,
            fontFamily: font.body,
            fontSize: fontSize.caption,
            fontStyle: "italic",
            color: color.inkSoft,
          }}
        >
          {note}
        </Text>
      ) : null}
    </>
  );
}
