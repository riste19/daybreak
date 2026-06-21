import type { Metadata } from "next";
import { ViewTransition } from "react";

import { SiteHeader } from "@/components/sections/site-header";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { SampleEmail } from "@/components/sections/sample-email";
import { Proof } from "@/components/sections/proof";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyDifferent } from "@/components/sections/why-different";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { isLoggedIn } from "@/lib/supabase/server";

export const metadata: Metadata = {
  // Keyword-rich absolute title for the homepage (overrides the layout default);
  // the description still comes from the root layout (site.description).
  title: { absolute: "Daybreak - A personalized daily motivational email" },
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Resolved once and shared by the sticky header, hero, and final CTA so the
  // logged-in/out CTA stays consistent without three separate auth round-trips.
  const loggedIn = await isLoggedIn();

  return (
    // Animates out (drift up + fade) only when leaving via a `nav-forward`
    // link — the "Set up your mornings" CTAs. All other navigation stays instant.
    <ViewTransition exit={{ "nav-forward": "page-leave", default: "none" }}>
      <SiteHeader loggedIn={loggedIn} />
      <main>
        <Hero loggedIn={loggedIn} />
        <Problem />
        {/* Show the product before explaining it, and cluster the proof with it. */}
        <SampleEmail />
        <Proof />
        <HowItWorks />
        <WhyDifferent />
        <FinalCta loggedIn={loggedIn} />
        <Footer />
      </main>
    </ViewTransition>
  );
}
