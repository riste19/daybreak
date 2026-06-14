"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { CookieConsent } from "./cookie-consent";

/**
 * Client-side PostHog setup for product analytics (funnels, autocapture).
 *
 * Init reads NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST. When the key is
 * absent (local dev without analytics) it simply does nothing — no errors, and
 * `usePostHog()` calls elsewhere become harmless no-ops.
 *
 * App Router doesn't fire a full page load on client navigations, so we disable
 * PostHog's built-in pageview capture and emit `$pageview` manually on route
 * change (see PostHogPageView). Autocapture stays on — it records the CTA clicks
 * (e.g. "Set up your mornings") without per-element wiring.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // captured manually below for App Router
      capture_pageleave: true,
      // GDPR: don't capture anything until the visitor accepts (see CookieConsent).
      // This suppresses the manual $pageview + autocapture while opted out.
      opt_out_capturing_by_default: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <CookieConsent />
    </PHProvider>
  );
}

/** Emits a `$pageview` whenever the path or query changes. */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.origin + pathname;
    const query = searchParams?.toString();
    if (query) url += `?${query}`;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
