"use client";

import { createContext, useContext } from "react";
import type { PostHog } from "posthog-js";

/**
 * Local PostHog context. We deliberately do NOT use `posthog-js/react`'s
 * provider/hook: that package statically `import`s the ~200KB posthog-js core,
 * so any module touching it pulls the whole core into first-load JS on every
 * route. Instead `PostHogProvider` loads the core with a dynamic `import()`
 * after hydration and feeds the client in here.
 *
 * The value is `null` until the core finishes loading (and stays `null` when no
 * analytics key is configured). Consumers must treat it as optional —
 * `posthog?.capture(...)`.
 */
export const PostHogContext = createContext<PostHog | null>(null);

/** The PostHog client for this render, or `null` if it hasn't loaded yet. */
export const usePostHog = () => useContext(PostHogContext);
