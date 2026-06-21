import * as React from "react";

import { DailyBody } from "../components/DailyBody";
import { EmailLayout } from "../components/EmailLayout";
import { links } from "../config";

/**
 * SampleEmail — the one-off taste sent to a no-login trial lead (not yet
 * subscribed). It's a real daily-style body, but the footer CTA invites them to
 * start the free trial. Preheader hints at the value, not the body text.
 */
export interface SampleEmailProps {
  subject: string;
  bodyParagraphs: string[];
  tone: string;
  themeOfDay: string;
  /** Required, working unsubscribe URL. */
  unsubscribeUrl: string;
  /** Where the footer CTA points. Defaults to the subscribe page. */
  subscribeUrl?: string;
  /** Override the controlled preheader. */
  preview?: string;
}

export function SampleEmail({
  subject,
  bodyParagraphs,
  tone,
  themeOfDay,
  unsubscribeUrl,
  subscribeUrl = links.subscribe,
  preview = "A taste of your morning — written for today, just for you.",
}: SampleEmailProps) {
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "sample", unsubscribeUrl, ctaUrl: subscribeUrl }}
    >
      <DailyBody
        subject={subject}
        bodyParagraphs={bodyParagraphs}
        tone={tone}
        themeOfDay={themeOfDay}
      />
    </EmailLayout>
  );
}

SampleEmail.PreviewProps = {
  subject: "The morning is yours before anyone asks for it",
  bodyParagraphs: [
    "Before the inbox fills and the day makes its demands, there's a quiet stretch that belongs only to you. You don't have to earn it. It's already here.",
    "Notice one thing you're carrying into today that you could set down — just for the next hour. See how the morning feels a little lighter without it.",
    "You're allowed to begin gently. The day will keep pace with you.",
  ],
  tone: "gentle",
  themeOfDay: "reflection",
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=sample-token",
} satisfies SampleEmailProps;

export default SampleEmail;
