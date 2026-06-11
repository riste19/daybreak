import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section id="join" className="dawn-glow relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-90 w-190 max-w-[140vw] -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
      />
      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center sm:py-28">
        <h2 className="font-display text-3xl font-medium leading-tight text-cream sm:text-4xl">
          Tomorrow could start a little differently.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-cream/75">
          Tell us what your mornings should focus on, and wake up to a message
          made for you. It only takes a minute.
        </p>

        <div className="mx-auto mt-9 flex flex-col items-center gap-3">
          <Button asChild size="lg" variant="glow">
            <Link href="/start" transitionTypes={["nav-forward"]}>
              Set up your mornings
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-sm text-cream/55">
            No app, no feed. One calm email a day.
          </p>
        </div>
      </div>
    </section>
  );
}
