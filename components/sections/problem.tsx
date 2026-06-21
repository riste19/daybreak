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
            You’ve tried this before. You know how it usually goes.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 space-y-5 text-left text-lg leading-relaxed text-ink-soft">
            <p>
              It starts with real intention. Then the habit tracker turns into
              one more red badge you’re dodging. The app becomes a feed you
              scroll past on your way to something else. And that “rise and grind”
              quote? It has never once known what you’re actually carrying that
              day.
            </p>
            <p>
              The problem was never your willpower. It’s that none of it knew the
              first thing about{" "}
              <span className="font-extrabold text-primary">You</span>, your Friday
              deadline, the chapter you avoid opening. A note written for you
              is harder to ignore than a quote written for everyone.
            </p>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-8 text-xl font-medium leading-snug text-ink sm:text-2xl">
            That gap — between advice for everyone and a note that actually knows
            your week — is the whole reason{" "}
            <span className="font-display text-primary">Daybreak</span> exists.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
