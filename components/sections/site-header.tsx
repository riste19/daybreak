"use client";

import * as React from "react";
import Link from "next/link";
import { Sunrise, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Sticky marketing header. Transparent over the dark hero, then solidifies into
 * a cream, blurred bar once you scroll past it — so there's always a visible
 * conversion path (and a sign-in link for returning users), not just at the
 * footer.
 *
 * Client component because the styling is scroll-aware. `loggedIn` is resolved
 * server-side by the page and passed in, so the CTA can mirror the hero
 * (dashboard vs. start) without a second auth round-trip.
 *
 * Scoped to marketing pages on purpose — do NOT mount in app/layout.tsx, or it
 * would paint over /start onboarding, /dashboard, /login and checkout.
 */
export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    // Solidify once we've scrolled roughly past the full-height (min-h-dvh) hero.
    const onScroll = () => {
      const threshold = (window.innerHeight || 800) * 0.85;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-cream/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              scrolled ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold",
            )}
          >
            <Sunrise className="size-4" aria-hidden />
          </span>
          <span
            className={cn(
              "font-display text-lg font-medium transition-colors",
              scrolled ? "text-ink" : "text-cream",
            )}
          >
            {site.name}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {!loggedIn && (
            <Link
              href="/login"
              className={cn(
                "hidden text-sm font-medium transition-colors sm:inline-flex",
                scrolled
                  ? "text-ink-soft hover:text-ink"
                  : "text-cream/70 hover:text-cream",
              )}
            >
              Sign in
            </Link>
          )}
          <Button asChild size="sm" variant="glow">
            <Link
              href={loggedIn ? "/dashboard" : "/start"}
              transitionTypes={["nav-forward"]}
            >
              {loggedIn ? "Dashboard" : "Get started"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
