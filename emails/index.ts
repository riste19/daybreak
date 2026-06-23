/**
 * Public surface of the Daybreak email package: the six templates, the shared
 * primitives, the design theme, the brand config, and the send helper.
 */

// Templates
export { SampleEmail, type SampleEmailProps } from "./templates/SampleEmail";
export {
  DailyTrialEmail,
  type DailyTrialEmailProps,
} from "./templates/DailyTrialEmail";
export {
  DailyPaidEmail,
  type DailyPaidEmailProps,
} from "./templates/DailyPaidEmail";
export { WelcomeEmail, type WelcomeEmailProps } from "./templates/WelcomeEmail";
export {
  TrialEndingEmail,
  type TrialEndingEmailProps,
} from "./templates/TrialEndingEmail";
export {
  PaymentConfirmationEmail,
  type PaymentConfirmationEmailProps,
} from "./templates/PaymentConfirmationEmail";

// Shared components
export { EmailLayout, type EmailLayoutProps } from "./components/EmailLayout";
export { Header, type HeaderProps } from "./components/Header";
export { Footer, type FooterProps, type FooterVariant } from "./components/Footer";
export { CTAButton, type CTAButtonProps } from "./components/CTAButton";
export { DailyBody, type DailyBodyProps } from "./components/DailyBody";

// Design + brand + transport
export { theme, type Theme } from "./theme";
export { from, DOMAIN, links } from "./config";
export { sendDaybreakEmail, type SendDaybreakEmailArgs } from "./send";
