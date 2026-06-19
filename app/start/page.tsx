import type { Metadata } from "next";
import { ViewTransition } from "react";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getSessionUser } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Get started",
  description: "Set up your daily morning email in a minute, pick what to focus on, and you're done.",
  robots: { index: false, follow: false },
};

export default async function StartPage() {
  // Owner check runs server-side; the client only ever receives a boolean, so
  // the owner email list never reaches the browser. Unauthenticated/unconfigured
  // → false → the normal (non-debug) review screen.
  const user = await getSessionUser();
  const isOwner = isOwnerEmail(user?.email);

  return (
    // Rises into the light when arrived at via a `nav-forward` CTA; otherwise
    // (direct load, back navigation) it appears with no animation.
    <ViewTransition enter={{ "nav-forward": "page-enter", default: "none" }}>
      <OnboardingFlow isOwner={isOwner} />
    </ViewTransition>
  );
}
