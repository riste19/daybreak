import { Column, Heading, Hr, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { links } from "../config";
import { theme } from "../theme";

/**
 * PaymentConfirmationEmail — the receipt sent after the first successful charge.
 * A short thank-you plus the receipt details (amount, date, next billing) in a
 * tidy panel, and a CTA to manage billing.
 */
export interface PaymentConfirmationEmailProps {
  firstName?: string;
  /** Pre-formatted amount charged, e.g. "$6.00". */
  amount: string;
  /** Pre-formatted charge date, e.g. "June 24, 2026". */
  date: string;
  /** Pre-formatted next billing date, e.g. "July 24, 2026". */
  nextBillingDate: string;
  /** Plan name. Default "Daybreak Daily". */
  planName?: string;
  /** Last 4 digits of the card, if available (e.g. "4242"). */
  cardLast4?: string;
  /** Where the "Manage billing" CTA points. */
  billingUrl?: string;
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

/** One label/value line in the receipt panel. */
function ReceiptRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <Row style={{ marginBottom: space.sm }}>
      <Column>
        <Text
          style={{
            margin: 0,
            fontFamily: font.body,
            fontSize: fontSize.small,
            color: color.inkSoft,
          }}
        >
          {label}
        </Text>
      </Column>
      <Column style={{ textAlign: "right" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: font.body,
            fontSize: fontSize.small,
            fontWeight: emphasize ? 700 : 500,
            color: color.ink,
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function PaymentConfirmationEmail({
  firstName,
  amount,
  date,
  nextBillingDate,
  planName = "Daybreak Daily",
  cardLast4,
  billingUrl = links.billing,
  unsubscribeUrl,
  preview = "Your receipt — thanks for making mornings a habit.",
}: PaymentConfirmationEmailProps) {
  const greeting = firstName ? `Thank you, ${firstName}.` : "Thank you.";
  return (
    <EmailLayout
      preview={preview}
      footer={{ variant: "paid", unsubscribeUrl, manageUrl: billingUrl }}
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
        Your subscription is active and your mornings will keep arriving. Here&rsquo;s
        your receipt for your records.
      </Text>

      {/* Receipt panel */}
      <Section
        style={{
          backgroundColor: color.accentSoft,
          border: `1px solid ${color.border}`,
          borderRadius: theme.radius.panel,
          padding: `${space.lg}px`,
          margin: `${space.xs}px 0 ${space.lg}px`,
        }}
      >
        <ReceiptRow label="Plan" value={planName} />
        <ReceiptRow label="Amount paid" value={amount} emphasize />
        <ReceiptRow label="Date" value={date} />
        {cardLast4 ? (
          <ReceiptRow label="Card" value={`•••• ${cardLast4}`} />
        ) : null}
        <Hr
          style={{
            border: "none",
            borderTop: `1px solid ${color.border}`,
            margin: `${space.sm}px 0`,
          }}
        />
        <ReceiptRow label="Next billing" value={nextBillingDate} />
      </Section>

      <Text style={paragraph}>
        You can update your card, change plans, or cancel anytime from your
        billing settings.
      </Text>

      <Section style={{ padding: `${space.sm}px 0 ${space.xs}px` }}>
        <CTAButton label="Manage billing" href={billingUrl} />
      </Section>
    </EmailLayout>
  );
}

PaymentConfirmationEmail.PreviewProps = {
  firstName: "Mara",
  amount: "$6.00",
  date: "June 24, 2026",
  nextBillingDate: "July 24, 2026",
  planName: "Daybreak Daily",
  cardLast4: "4242",
  unsubscribeUrl: "https://daybreakmail.com/unsubscribe?t=receipt-token",
} satisfies PaymentConfirmationEmailProps;

export default PaymentConfirmationEmail;
