import { Target, SlidersHorizontal, Sunrise } from "lucide-react";

import { Reveal } from "@/components/reveal";

const steps = [
  {
    icon: Target,
    title: "Tell us what you’re working on",
    body: "A few questions about your goal and what’s actually on your plate this week. Two minutes, give or take.",
  },
  {
    icon: SlidersHorizontal,
    title: "Pick a tone and a time",
    body: "Gentle, blunt, or something in between — whatever you’ll actually read at 7 a.m. Then set the minute it lands.",
  },
  {
    icon: Sunrise,
    title: "Wake up to it",
    body: "Each morning a new one shows up in your inbox, written around what you've told us. Your goals and intentions are tottaly customizable later.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-deep px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            Set it up once. After that, it just shows up.
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 120}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-2xl font-medium text-primary/70">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
