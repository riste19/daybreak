import { ViewTransition } from "react";

import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyDifferent } from "@/components/sections/why-different";
import { SampleEmail } from "@/components/sections/sample-email";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    // Animates out (drift up + fade) only when leaving via a `nav-forward`
    // link — the "Set up your mornings" CTAs. All other navigation stays instant.
    <ViewTransition exit={{ "nav-forward": "page-leave", default: "none" }}>
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <WhyDifferent />
        <SampleEmail />
        <FinalCta />
        <Footer />
      </main>
    </ViewTransition>
  );
}
