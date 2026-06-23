import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { links } from "../config";
import { theme } from "../theme";

/**
 * WelcomeEmail — sent the moment a trial starts. Warm intro, sets the one
 * expectation (a single email each morning), states the trial length and that
 * they can cancel anytime before it ends, and points them to set preferences.
 *
 * This is transactional copy (not AI-generated), so the structural wording lives
 * in the template; the variable bits (name, trial length, links) are props.
 */
export interface WelcomeEmailProps {
  firstName?: string;
  /** Trial length in days. Default 7. */
  trialLength?: number;
  /** Where the "Set your preferences" CTA points. */
  preferencesUrl?: string;
  unsubscribeUrl: string;
  preview?: string;
}

const { color, font, fontSize, space } = theme;

const paragraph: React.CSSProperties = {
  margin: `0 0 ${space.md}px`,
  fontFamily: font.body,
  fontSize: fontSize.body,
  lineHeight: 1.65,
  color: color.ink,
};

export function WelcomeEmail({
  firstName,
  trialLength = 7,
  preferencesUrl = links.preferences,
  unsubscribeUrl,
  preview = "Welcome — your first morning lands tomorrow.",
}: WelcomeEmailProps) {
  const greeting = firstName ? `Welcome, ${firstName}.` : "Welcome.";
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "trial", unsubscribeUrl, manageUrl: preferencesUrl }}
    >
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
        {greeting}
      </Heading>

      <Text style={paragraph}>
        You just made a small, kind decision for your future mornings. Here&rsquo;s
        what happens now: each day, one short email arrives — written for where you
        are, in the tone you chose. That&rsquo;s it. No feeds, no streaks, no noise.
      </Text>
      <Text style={paragraph}>
        Your free trial runs for {trialLength} days. You can change your tone,
        timing, and focus areas anytime — and if it&rsquo;s not for you, you can
        cancel before day {trialLength} and you won&rsquo;t be charged.
      </Text>
      <Text style={paragraph}>
        Want to shape what lands tomorrow? Take a minute to set your preferences.
      </Text>

      <Section style={{ padding: `${space.sm}px 0 ${space.xs}px` }}>
        <CTAButton label="Set your preferences" href={preferencesUrl} />
      </Section>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: "Mara",
  trialLength: 7,
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=welcome-token",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
