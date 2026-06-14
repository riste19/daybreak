import type { Metadata } from "next";
import { CalendarOff, HeartHandshake, MailX } from "lucide-react";

import { site } from "@/lib/config";
import { Footer } from "@/components/sections/footer";
import { PageHero } from "@/components/sections/page-hero";
import { PricingPlans } from "@/components/subscribe/pricing-plans";

export const metadata: Metadata = {
  title: "Plans & pricing",
  description: `Keep your mornings personal, every day. Compare ${site.name}'s free trial with Daybreak Daily — your time, your tone, your own email layout.`,
};

const reassurances = [
  {
    icon: CalendarOff,
    title: "Cancel in a click",
    body: "No contracts, no hoops. Pause or leave whenever you like — your settings wait for you.",
  },
  {
    icon: MailX,
    title: "No app, ever",
    body: "Everything happens in your inbox. Nothing to download, no feed to check, no notifications.",
  },
  {
    icon: HeartHandshake,
    title: "Your words stay yours",
    body: "What you share shapes your emails and nothing else. We never sell it or train on it.",
  },
];

const faqs = [
  {
    q: "Is the free version really free?",
    a: "Yes. First Light gives you a full week of personalized mornings with no card required — so you can feel the difference before deciding.",
  },
  {
    q: "What is the “daily customisation” I keep seeing?",
    a: "On Daybreak Daily you design your own email in the builder: reorder sections, pin your own words or a daily rule, add reminders, and set the exact minute it arrives.",
  },
  {
    q: "Can I get it twice a day, or only on weekends?",
    a: "Daily includes an optional evening send, weekend editions with a slower tone, and a longer weekly special. Prefer weekdays only? Choose exactly which days you hear from us.",
  },
  {
    q: "Can I switch plans or cancel later?",
    a: "Anytime. Move between monthly and annual, or cancel in a click from any email. Your goals and preferences are kept so you can pick up right where you left off.",
  },
];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  // The daily email's "Go daily" link carries ?email=<recipient> so checkout
  // can pre-fill (and auto-open) instead of asking again.
  const { email } = await searchParams;
  const defaultEmail = (typeof email === "string" ? email : "").trim().slice(0, 254);

  return (
    <main>
      <PageHero
        eyebrow="Plans & pricing"
        title="Keep your mornings personal — every day"
        subtitle={`Start free, then make it a habit. ${site.name} Daily adds daily delivery on your schedule, your own email layout, and a lot more.`}
      />

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <PricingPlans defaultEmail={defaultEmail} />
      </section>

      {/* Reassurances */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {reassurances.map(({ icon: Icon, title, body }) => (
              <div key={title} className="text-center sm:text-left">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <h2 className="text-center font-display text-3xl font-medium text-ink">
          Questions, answered
        </h2>
        <dl className="mt-10 space-y-8">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-display text-lg font-medium text-ink">{q}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Footer />
    </main>
  );
}
