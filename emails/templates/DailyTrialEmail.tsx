import * as React from "react";

import { DailyBody } from "../components/DailyBody";
import { EmailLayout } from "../components/EmailLayout";
import { links, TRIAL_LENGTH_DAYS } from "../config";

/**
 * DailyTrialEmail — the daily email for a subscriber currently in their free
 * trial. Identical body to the paid daily, plus one subtle "Day X of N" line and
 * a manage-preferences footer. No hard sell — the trial sells itself.
 */
export interface DailyTrialEmailProps {
  subject: string;
  bodyParagraphs: string[];
  tone: string;
  themeOfDay: string;
  /** Which day of the trial this is (1-based). */
  trialDay: number;
  /** Total trial length in days. Defaults to the shared TRIAL_LENGTH_DAYS. */
  trialLength?: number;
  unsubscribeUrl: string;
  /** Preferences editor (defaults to the dashboard editor). */
  manageUrl?: string;
  preview?: string;
}

export function DailyTrialEmail({
  subject,
  bodyParagraphs,
  tone,
  themeOfDay,
  trialDay,
  trialLength = TRIAL_LENGTH_DAYS,
  unsubscribeUrl,
  manageUrl = links.preferences,
  preview = "Your morning, made for today.",
}: DailyTrialEmailProps) {
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "trial", unsubscribeUrl, manageUrl }}
    >
      <DailyBody
        subject={subject}
        bodyParagraphs={bodyParagraphs}
        tone={tone}
        themeOfDay={themeOfDay}
        note={`Day ${trialDay} of ${trialLength} in your free trial.`}
      />
    </EmailLayout>
  );
}

DailyTrialEmail.PreviewProps = {
  subject: "Small steps still count as steps",
  bodyParagraphs: [
    "You set out to build something this week, and it's tempting to measure it only by the finish line. But the finish line isn't where the work lives — it lives in the next small move.",
    "Pick the smallest version of the thing you've been avoiding. Not the whole project. The first ten minutes of it. Start there, and let momentum do the rest.",
  ],
  tone: "direct",
  themeOfDay: "momentum",
  trialDay: 2,
  trialLength: TRIAL_LENGTH_DAYS,
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=trial-token",
} satisfies DailyTrialEmailProps;

export default DailyTrialEmail;
