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
    body: "Each morning a new one shows up in your inbox, written around what you've told us. Your goals and intentions stay fully customizable later.",
  },
];

// The node brightens step by step — a small "sun rising" cue down the timeline,
// built only from existing dawn tokens (gold / amber / amber-soft / night).
const nodeStyles = [
  "bg-gold/15 text-amber ring-1 ring-gold/40",
  "bg-amber-soft/40 text-primary ring-1 ring-amber/50 shadow-[0_8px_24px_-12px_rgba(245,166,35,0.65)]",
  "bg-gold text-night ring-1 ring-gold shadow-[0_10px_30px_-10px_rgba(255,210,122,0.9)]",
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

        {/* Vertical "sunrise" timeline: each step is a node on a warm spine, the
            light gathering as you move down toward "wake up to it". */}
        <ol className="relative mx-auto mt-14 max-w-2xl">
          {/* Soft pool of morning light behind the final, brightest node. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
          />

          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <Reveal
                as="li"
                key={step.title}
                delay={i * 120}
                className="relative flex gap-5 pb-12 last:pb-0 sm:gap-6"
              >
                {/* Connector to the next node (omitted on the last). */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-6 top-14 bottom-2 w-px -translate-x-1/2 bg-linear-to-b from-gold/60 to-amber/40 sm:left-7 sm:top-16"
                  />
                )}

                <span
                  className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14 ${nodeStyles[i]}`}
                >
                  <step.icon className="size-5 sm:size-6" aria-hidden />
                </span>

                <div className="pt-1 sm:pt-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
