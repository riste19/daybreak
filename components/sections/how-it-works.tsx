import { Target, SlidersHorizontal, Sunrise } from "lucide-react";

import { Reveal } from "@/components/reveal";

const steps = [
  {
    icon: Target,
    title: "Tell it what you’re chasing",
    body: "Answer a few quick questions about your goal, the tasks on your plate, and what matters right now. Takes about two minutes.",
  },
  {
    icon: SlidersHorizontal,
    title: "Pick your tone and your time",
    body: "Gentle, direct, playful, or stoic — and the exact minute it arrives. Your morning, set up your way.",
  },
  {
    icon: Sunrise,
    title: "Wake up to a fresh email",
    body: "Each morning, a short message written around your goals lands in your inbox. New every day, never a repeat.",
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
            Set it up once. Wake up to it every day.
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
