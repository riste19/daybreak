import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Get started",
  description: "Set up your daily morning email in a minute — pick what to focus on, and you're done.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return <OnboardingFlow />;
}
