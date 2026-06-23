import { Reveal } from "@/components/reveal";

/**
 * Social-proof / trust band.
 *
 * ⚠️ PLACEHOLDER CONTENT — the testimonials and the stat below are ILLUSTRATIVE,
 * not real customer quotes or verified metrics. Daybreak is live and takes
 * payment, so before this reaches real visitors either (a) replace these with
 * genuine, attributable testimonials and a true number, or (b) reframe them
 * honestly as examples. Shipping fabricated reviews as real is an FTC/trust risk.
 *
 * Background is `bg-cream` so the homepage keeps its light/deep alternation:
 * SampleEmail's warm gradient end → this (light) → HowItWorks (cream-deep).
 */

// Illustrative only — replace before launch (see file header).
const stat = {
  value: "Thousands",
  label: "of mornings sent — and opened 5 days out of 7.",
};

// Illustrative only — replace before launch (see file header).
const testimonials = [
  {
    quote:
      "I’ve muted every habit app I ever downloaded. This is the only thing left that gets read — because it’s about my week, not everyone’s.",
    name: "Maya R.",
    detail: "Teacher",
  },
  {
    quote:
      "Three minutes before the kids are up. It’s quietly become the calmest part of my morning.",
    name: "Daniel K.",
    detail: "Dad of two",
  },
  {
    quote:
      "I picked a blunt tone and a 6am send. It reads like a friend who actually remembers what I’m working on.",
    name: "Priya S.",
    detail: "Founder",
  },
];

/** Initials for the little avatar chip, e.g. "Maya R." → "MR". */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Proof() {
  return (
    <section id="proof" className="bg-cream px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            In good company
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            Mornings that actually get read.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">{stat.value}</span> {stat.label}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="figure" key={t.name} delay={i * 120}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                <p className="flex-1 leading-relaxed text-ink">“{t.quote}”</p>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(t.name)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-ink">{t.name}</span>
                    <span className="block text-ink-soft">{t.detail}</span>
                  </span>
                </figcaption>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
