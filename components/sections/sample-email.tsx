import { Sunrise } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { site } from "@/lib/config";

export function SampleEmail() {
  return (
    <section
      id="sample"
      className="relative overflow-hidden bg-gradient-to-b from-cream-deep to-[#f3dfc4] px-6 py-24 sm:py-28"
    >
      {/* Warm morning light pooling behind the message. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[460px] w-[680px] max-w-[120vw] -translate-x-1/2 rounded-full bg-gold/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl">
        <Reveal className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            See it for yourself
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            This is what lands at 7:00 a.m.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            A real example for someone writing their first novel. Tomorrow’s
            would be different — and so would yours.
          </p>
        </Reveal>

        {/* The message itself, gently arriving. */}
        <Reveal delay={150}>
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(42,33,24,0.35)]">
            {/* Email header / chrome */}
            <header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-5 py-4 sm:px-7">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sunrise className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {site.name}{" "}
                  <span className="font-normal text-ink-soft">
                    &lt;{site.contactEmail}&gt;
                  </span>
                </p>
                <p className="truncate text-xs text-ink-soft">to Maya</p>
              </div>
              <time className="shrink-0 text-xs text-ink-soft" dateTime="07:00">
                7:00 AM
              </time>
            </header>

            {/* Subject */}
            <div className="border-b border-border px-5 py-4 sm:px-7">
              <h3 className="font-display text-xl font-medium text-ink">
                Two hundred honest words
              </h3>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-7 text-[15px] leading-relaxed text-ink sm:px-7 sm:text-base">
              <p>Morning, Maya.</p>
              <p>
                Yesterday you said chapter nine was fighting you — and then you
                showed up to it anyway. Notice that. The showing up{" "}
                <em>is</em> the writing; the rest is just typing.
              </p>
              <p>
                You don’t need to finish the chapter today. You need two hundred
                honest words and a single note about where to pick up tomorrow.
                Momentum was never a lightning strike. It’s arriving at the page
                before the doubt wakes up.
              </p>
              <p>
                Your protagonist has been waiting on that rooftop since Tuesday.
                Go see what she does.
              </p>
              <p className="text-ink-soft">— {site.name}</p>
            </div>

            {/* Subtle "how it stays personal" meta strip */}
            <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-secondary/40 px-5 py-3 text-xs text-ink-soft sm:px-7">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                Tone: Gentle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                Today’s theme: Momentum
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                Goal: Finish the first draft
              </span>
            </footer>
          </article>
        </Reveal>

        <Reveal delay={250} className="mt-6 text-center text-sm text-ink-soft">
          <p>Different goal, different tone, different morning — every single day.</p>
        </Reveal>
      </div>
    </section>
  );
}
