import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/config";
import { isLoggedIn } from "@/lib/supabase/server";

export async function Hero() {
  // Signed in → the primary CTA points to the dashboard (and signals you're in).
  const loggedIn = await isLoggedIn();

  return (
    <section className="dawn-glow relative flex min-h-dvh flex-col overflow-hidden">
      {/* Rising sun — purely decorative. Blooms up from the horizon on load. */}
      <div
        aria-hidden
        className="animate-dawn-bloom pointer-events-none absolute bottom-0 left-1/2 h-105 w-205 max-w-[140vw] -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span
          className="animate-dawn-rise mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm font-medium text-gold backdrop-blur-sm"
          style={{ animationDelay: "90ms" }}
        >
          <span className="size-1.5 rounded-full bg-gold" aria-hidden />
          Your daily nudge, delivered at first light
        </span>

        <h1
          className="animate-dawn-rise-text font-display text-4xl font-medium leading-[1.08] tracking-tight text-cream sm:text-5xl md:text-6xl"
          style={{ animationDelay: "230ms" }}
        >
          Start each morning with a message made just for you.
        </h1>

        <p
          className="animate-dawn-rise mt-6 max-w-xl text-lg leading-relaxed text-cream/75"
          style={{ animationDelay: "370ms" }}
        >
          {site.name} is a personalized daily motivational email, one short,
          thoughtfully written note, shaped around your goals, your
          tasks, and the tone you choose. No app to open, no feed to scroll.
          Just a calm reason to begin with intention.
        </p>

        <div
          className="animate-dawn-rise mt-9 flex flex-col items-center gap-3"
          style={{ animationDelay: "500ms" }}
        >
          <Button asChild size="lg" variant="glow">
            <Link
              href={loggedIn ? "/dashboard" : "/start"}
              transitionTypes={["nav-forward"]}
            >
              {loggedIn ? "Go to your dashboard" : "Set up your mornings"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-sm text-cream/55">
            {loggedIn
              ? "Welcome back. Manage your mornings anytime."
              : "Free to start. Takes about a minute, pick as little as one thing."}
          </p>
        </div>
      </div>
    </section>
  );
}
