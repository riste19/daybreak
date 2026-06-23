import { Reveal } from "@/components/reveal";
import { SampleEmails } from "@/components/sections/sample-emails";

export function SampleEmail() {
  return (
    <section
      id="sample"
      className="relative overflow-hidden bg-gradient-to-b from-cream-deep to-[#f3dfc4] px-6 pb-24 pt-14 sm:py-28"
    >
      {/* Warm morning light pooling behind the message. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[460px] w-[680px] max-w-[120vw] -translate-x-1/2 rounded-full bg-gold/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl">
        <Reveal className="mb-7 text-center sm:mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            See it for yourself
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            The same idea, three different lives.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Click through them. Each note is written for that person’s week, and
            folds in the small reminders they set for themselves.
          </p>
        </Reveal>

        {/* The deck of example messages, gently arriving. */}
        <Reveal delay={150}>
          <SampleEmails />
        </Reveal>

        <Reveal delay={250} className="mt-6 text-center text-sm text-ink-soft">
          <p>And tomorrow there’s a new one, about wherever you are by then.</p>
        </Reveal>
      </div>
    </section>
  );
}
