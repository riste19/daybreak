"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * GDPR opt-in cookie banner. PostHog is initialized with
 * `opt_out_capturing_by_default: true` (see posthog-provider), so no analytics
 * are captured until the visitor clicks Accept. The banner shows only while no
 * choice has been made; PostHog persists the decision, so it won't reappear.
 */
export function CookieConsent() {
  const posthog = usePostHog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No analytics configured (e.g. local dev without a key) → no banner.
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    // Wait until PostHog has loaded its persisted consent before deciding whether
    // to show the banner — otherwise a prior choice would be missed on reload.
    let tries = 0;
    const check = (): boolean => {
      const ph = posthog as (typeof posthog & { __loaded?: boolean }) | undefined;
      if (!ph?.__loaded) return false;
      const decided =
        ph.has_opted_in_capturing() || ph.has_opted_out_capturing();
      setVisible(!decided);
      return true;
    };

    if (check()) return;
    const id = setInterval(() => {
      if (check() || ++tries > 25) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [posthog]);

  if (!visible) return null;

  const accept = () => {
    posthog?.opt_in_capturing();
    setVisible(false);
  };
  const decline = () => {
    posthog?.opt_out_capturing();
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card/95 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink-soft">
          We use privacy-friendly analytics to understand how the site is used —
          only if you say yes.{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
