import { WaitlistForm } from "@/components/waitlist-form";

export function FinalCta() {
  return (
    <section id="join" className="dawn-glow relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[760px] max-w-[140vw] -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
      />
      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center sm:py-28">
        <h2 className="font-display text-3xl font-medium leading-tight text-cream sm:text-4xl">
          Tomorrow could start a little differently.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-cream/75">
          Join the waitlist and be among the first to wake up to {""}
          a message made for you. We’ll let you know the moment it’s ready.
        </p>

        <div className="mx-auto mt-9 max-w-md">
          <WaitlistForm idPrefix="final" tone="onDark" />
        </div>
      </div>
    </section>
  );
}
