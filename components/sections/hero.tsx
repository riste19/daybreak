import { WaitlistForm } from "@/components/waitlist-form";
import { site } from "@/lib/config";

export function Hero() {
  return (
    <section className="dawn-glow relative overflow-hidden">
      {/* Rising sun arc — purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[820px] max-w-[140vw] -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm font-medium text-gold backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden />
          Your daily nudge, delivered at first light
        </span>

        <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-cream sm:text-5xl md:text-6xl">
          Start each morning with a message made just for you.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
          {site.name} sends one short, thoughtfully written email at dawn —
          shaped around your goals, your tasks, and the tone you choose. No app
          to open. No feed to scroll. Just a calm reason to begin with intention.
        </p>

        <div className="mt-9 w-full max-w-md">
          <WaitlistForm idPrefix="hero" tone="onDark" />
        </div>
      </div>
    </section>
  );
}
