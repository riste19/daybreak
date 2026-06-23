"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import type { PostHog } from "posthog-js";

import { CookieConsent } from "./cookie-consent";
import { PostHogContext, usePostHog } from "./posthog-context";

/**
 * Client-side PostHog setup for product analytics (funnels, autocapture).
 *
 * The ~200KB posthog-js core is the single biggest item in first-load JS, and
 * it sits on the critical path of every route. So we DON'T statically import it
 * (nor `posthog-js/react`, which would). Instead we dynamically `import()` the
 * core in an effect after hydration — off the critical path — and expose the
 * loaded client through our own lightweight context (see posthog-context.ts).
 * `{children}` render immediately and never block on the analytics chunk.
 *
 * Init reads NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST. When the key is
 * absent (local dev without analytics) the core is never loaded and the context
 * value stays `null`, so `usePostHog()` calls elsewhere become harmless no-ops.
 *
 * App Router doesn't fire a full page load on client navigations, so we disable
 * PostHog's built-in pageview capture and emit `$pageview` manually on route
 * change (see PostHogPageView). Autocapture stays on — it records the CTA clicks
 * (e.g. "Set up your mornings") without per-element wiring.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<PostHog | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
          capture_pageview: false, // captured manually below for App Router
          capture_pageleave: true,
          // GDPR: don't capture anything until the visitor accepts (see CookieConsent).
          // This suppresses the manual $pageview + autocapture while opted out.
          opt_out_capturing_by_default: true,
        });
      }
      setClient(posthog);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PostHogContext.Provider value={client}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <CookieConsent />
    </PostHogContext.Provider>
  );
}

/**
 * Emits a `$pageview` whenever the path or query changes. The client arrives
 * asynchronously, so this also fires once for the initial route the moment the
 * core finishes loading (the effect re-runs when `ph` becomes non-null).
 */
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
