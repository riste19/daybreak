"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePostHog } from "./posthog-context";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Event the "Manage cookie preferences" link (privacy page) dispatches to
 * reopen the banner — so consent can be changed or withdrawn at any time
 * (GDPR Art. 7(3)), not just on the first visit.
 */
export const OPEN_COOKIE_SETTINGS_EVENT = "daybreak:open-cookie-settings";

// Our own record of the choice. We don't rely on PostHog's consent state to
// decide whether to show the banner: PostHog is initialized with
// `opt_out_capturing_by_default: true`, so it reports "opted out" before the
// visitor has actually chosen — which would hide the banner forever.
const CONSENT_KEY = "daybreak-cookie-consent"; // "accepted" | "declined"

// Keep in sync with the `duration-300` transition below.
const ANIM_MS = 300;

// Delay before the banner appears on each page, so it doesn't pop in mid-load.
const SHOW_DELAY_MS = 1000;

/**
 * Standard GDPR/ePrivacy cookie banner. No analytics are captured until the
 * visitor clicks Accept (PostHog stays opted out by default). With no stored
 * choice the banner slides in one second after the page loads; once a choice is
 * made it animates out and doesn't reappear, but it can be reopened from the
 * privacy page.
 */
export function CookieConsent() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false); // present in the DOM
  const [shown, setShown] = useState(false); // animated in/out state

  // No stored choice → show the banner one second after each page loads.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(CONSENT_KEY);
    } catch {
      // localStorage unavailable (private mode) — show the banner anyway.
    }
    if (stored) return;

    const id = window.setTimeout(() => setMounted(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Allow the privacy page to reopen the banner to change/withdraw consent.
  useEffect(() => {
    const open = () => setMounted(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  // Once in the DOM, trigger the enter animation on the next frame.
  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  if (!mounted) return null;

  const choose = (accepted: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
    } catch {
      // ignore — choice still applies for this session via PostHog below.
    }
    const ph = posthog as (typeof posthog & { __loaded?: boolean }) | undefined;
    if (ph?.__loaded) {
      if (accepted) ph.opt_in_capturing();
      else ph.opt_out_capturing();
    }
    // Animate out, then unmount once the transition finishes.
    setShown(false);
    window.setTimeout(() => setMounted(false), ANIM_MS);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 px-4 pb-4 transition-all duration-300 ease-out motion-reduce:transition-none sm:px-6 sm:pb-6",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card/95 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink-soft">
          We use privacy-friendly analytics to understand how the site is used,
          only if you say yes.{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Privacy &amp; cookies
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose(false)}>
            Decline
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
