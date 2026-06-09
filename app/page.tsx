import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyDifferent } from "@/components/sections/why-different";
import { SampleEmail } from "@/components/sections/sample-email";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <WhyDifferent />
      <SampleEmail />
      <FinalCta />
      <Footer />
    </main>
  );
}
