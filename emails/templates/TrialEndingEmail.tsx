import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { links } from "../config";
import { theme } from "../theme";

/**
 * TrialEndingEmail — sent ~24h before the first charge (the final day of the trial).
 * A friendly heads-up: states the amount and date, gives a clear way to manage
 * or cancel. Reassuring, not pushy — the goal is no surprises, not pressure.
 */
export interface TrialEndingEmailProps {
  firstName?: string;
  /** Pre-formatted charge amount, e.g. "$6". */
  chargeAmount: string;
  /** Pre-formatted charge date, e.g. "June 24, 2026". */
  chargeDate: string;
  /** Plan name shown in the heads-up. Default "Daybreak Daily". */
  planName?: string;
  /** Where the manage/cancel CTA points. */
  manageUrl?: string;
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

export function TrialEndingEmail({
  firstName,
  chargeAmount,
  chargeDate,
  planName = "Daybreak Daily",
  manageUrl = links.manage,
  unsubscribeUrl,
  preview = "A quick heads-up before your trial converts — no surprises.",
}: TrialEndingEmailProps) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "trial", unsubscribeUrl, manageUrl }}
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
        Your trial wraps up tomorrow
      </Heading>

      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>
        We hope the past few mornings have been worth waking up to. Just so
        there are no surprises: your free trial ends tomorrow, and your{" "}
        {planName} subscription will begin.
      </Text>

      {/* The single fact that matters, set apart so it can't be missed. */}
      <Section
        style={{
          backgroundColor: color.accentSoft,
          border: `1px solid ${color.border}`,
          borderRadius: theme.radius.panel,
          padding: `${space.md}px ${space.lg}px`,
          margin: `${space.xs}px 0 ${space.lg}px`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: font.body,
            fontSize: fontSize.body,
            lineHeight: 1.6,
            color: color.ink,
          }}
        >
          You&rsquo;ll be charged <strong>{chargeAmount}</strong> on{" "}
          <strong>{chargeDate}</strong>.
        </Text>
      </Section>

      <Text style={paragraph}>
        Nothing to do if you&rsquo;d like to keep your mornings going. If now
        isn&rsquo;t the time, you can cancel before then and you won&rsquo;t be
        charged — no hard feelings, and you&rsquo;re always welcome back.
      </Text>

      <Section style={{ padding: `${space.sm}px 0 ${space.xs}px` }}>
        <CTAButton label="Manage or cancel" href={manageUrl} />
      </Section>
    </EmailLayout>
  );
}

TrialEndingEmail.PreviewProps = {
  firstName: "Mara",
  chargeAmount: "$6",
  chargeDate: "June 24, 2026",
  planName: "Daybreak Daily",
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=ending-token",
} satisfies TrialEndingEmailProps;

export default TrialEndingEmail;
