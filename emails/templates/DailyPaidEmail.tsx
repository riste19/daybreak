import * as React from "react";

import { DailyBody } from "../components/DailyBody";
import { EmailLayout } from "../components/EmailLayout";
import { links } from "../config";

/**
 * DailyPaidEmail — the clean daily email for a paying subscriber. No trial
 * chrome, no upsell. The footer offers manage preferences / change tone /
 * unsubscribe and nothing more.
 */
export interface DailyPaidEmailProps {
  subject: string;
  bodyParagraphs: string[];
  tone: string;
  themeOfDay: string;
  unsubscribeUrl: string;
  /** Preferences editor. */
  manageUrl?: string;
  /** "Change tone" target. */
  changeToneUrl?: string;
  preview?: string;
}

export function DailyPaidEmail({
  subject,
  bodyParagraphs,
  tone,
  themeOfDay,
  unsubscribeUrl,
  manageUrl = links.manage,
  changeToneUrl = links.preferences,
  preview = "Your morning, made for today.",
}: DailyPaidEmailProps) {
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "paid", unsubscribeUrl, manageUrl, changeToneUrl }}
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

DailyPaidEmail.PreviewProps = {
  subject: "You are not behind. You are exactly here.",
  bodyParagraphs: [
    "Somewhere along the way, 'productive' started meaning 'ahead.' But there is no schedule the universe is holding you to. There is only the work in front of you and the person doing it.",
    "Today, trade the question 'Am I behind?' for 'What's the next honest thing?' One answers itself with anxiety. The other answers itself with action.",
    "Begin where your feet are.",
  ],
  tone: "stoic",
  themeOfDay: "identity",
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=paid-token",
} satisfies DailyPaidEmailProps;

export default DailyPaidEmail;
