import type { Metadata } from "next";

import { PageHero } from "@/components/sections/page-hero";
import { Footer } from "@/components/sections/footer";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving Daybreak daily emails.",
  // A utility page — keep it out of search results.
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main>
      <PageHero
        eyebrow="Unsubscribe"
        title="Stop your daily emails"
        subtitle="Enter your email and we'll stop sending. No hard feelings, you can come back any time."
      />
      <section className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <UnsubscribeForm initialEmail={email ?? ""} />
      </section>
      <Footer />
    </main>
  );
}
