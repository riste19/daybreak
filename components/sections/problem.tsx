import { Reveal } from "@/components/reveal";

export function Problem() {
  return (
    <section className="bg-cream px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Sound familiar?
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            Motivation fades. The apps pile up. The quotes ring hollow.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 space-y-5 text-left text-lg leading-relaxed text-ink-soft">
            <p>
              You started with real intention. Then the habit tracker became one
              more red badge to avoid. The motivation app turned into a feed you
              scroll past. And a generic “rise and grind” quote has never once
              known what you’re actually carrying.
            </p>
            <p>
              The truth is simple: encouragement only lands when it’s about{" "}
              <span className="font-medium text-ink">you</span> — your goal, this
              week, today. Not everyone. Not in general. You.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
