import Link from "next/link";
import { ArrowLeft, Sunrise } from "lucide-react";

import { site } from "@/lib/config";

/**
 * Dark "first light" header band reused by the standalone content pages
 * (Contact, About). Bookends the page against the matching night-toned Footer,
 * and echoes the hero's dawn glow without its one-shot entrance animation.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="dawn-glow relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-105 w-205 max-w-[140vw] -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl px-6 pt-7 pb-16 sm:pt-9 sm:pb-20">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <Sunrise className="size-4" aria-hidden />
            </span>
            <span className="font-display text-lg font-medium text-cream">
              {site.name}
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-cream/70 transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back home
          </Link>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center sm:mt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm font-medium text-gold backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-gold" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="mt-6 font-display text-4xl font-medium leading-[1.1] tracking-tight text-cream sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/75">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
