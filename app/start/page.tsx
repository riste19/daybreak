import type { Metadata } from "next";
import { ViewTransition } from "react";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Get started",
  description: "Set up your daily morning email in a minute, pick what to focus on, and you're done.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return (
    // Rises into the light when arrived at via a `nav-forward` CTA; otherwise
    // (direct load, back navigation) it appears with no animation.
    <ViewTransition enter={{ "nav-forward": "page-enter", default: "none" }}>
      <OnboardingFlow />
    </ViewTransition>
  );
}
