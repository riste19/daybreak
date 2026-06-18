import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Feather, Sunrise } from "lucide-react";

import { site } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/sections/footer";
import { PageHero } from "@/components/sections/page-hero";

export const metadata: Metadata = {
  title: "About us",
  description: `The story and the small team behind ${site.name}, one calm, personal email at first light.`,
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Sunrise,
    title: "Calm over noise",
    body: "No app to open, no feed to scroll, no streaks to defend. One short message, then the rest of your day is yours.",
  },
  {
    icon: Feather,
    title: "Personal, not generic",
    body: "Every email is written around your goals, your tasks, and the tone you choose, not a template with your name pasted on top.",
  },
  {
    icon: Compass,
    title: "Intention, gently",
    body: "We're here to help you begin with purpose, not to manufacture urgency. A nudge, never a nag.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="Our story"
        title="Mornings, made personal"
        subtitle={`${site.name} began with a simple question: what if the first thing you read each day was written just for you?`}
      />

      <section className="mx-auto max-w-2xl space-y-6 px-6 py-16 text-lg leading-relaxed text-ink-soft sm:py-20">
        <p>
          Most mornings start with a flood: notifications, headlines, other
          people's priorities. We wanted the opposite: a single, quiet moment
          that points you back toward what actually matters to{" "}
          <span className="text-ink">you</span>.
        </p>
        <p>
          So we built {site.name}. You tell us what you're working toward and
          the tone that lands for you, and each morning we send one short,
          thoughtfully written email, shaped around your goals and tasks,
          delivered at the time you set. That's the whole product. No dashboard
          to maintain, nothing to keep up with.
        </p>
        <p>
          We're a small team that cares a lot about the craft of a good sentence
          and the feeling of an unhurried start. We'd rather earn one calm
          minute of your morning than another hour of your attention.
        </p>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-center font-display text-3xl font-medium text-ink">
            What we believe
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-xl font-medium text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          Start tomorrow a little differently.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          Tell us what your mornings should focus on. It only takes a minute.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" variant="glow">
            <Link href="/start" transitionTypes={["nav-forward"]}>
              Set up your mornings
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <p className="text-sm text-ink-soft">
            Questions first?{" "}
            <Link
              href="/contact"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Get in touch
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
