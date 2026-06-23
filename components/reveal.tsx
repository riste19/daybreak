"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  /** ms delay before the reveal animates in (only applies to the enter). */
  delay?: number;
  className?: string;
  as?: React.ElementType;
}

/**
 * Reveals children with a gentle fade + rise the first time they scroll into
 * view.
 *
 * Built as a PROGRESSIVE ENHANCEMENT, on purpose: the content renders fully
 * VISIBLE by default (server HTML, no-JS, reduced motion, an environment
 * without IntersectionObserver, or a slow/failed hydration all leave it
 * visible). A section can therefore never get stuck invisible — the failure
 * mode of the old "start at opacity:0, reveal from JS" approach, which broke
 * below-the-fold sections on mobile (slow hydration, a threshold tall sections
 * never reached, and elements that loaded already scrolled past).
 *
 * Once JS is healthy we only arm elements that are still well BELOW the fold,
 * so the hide-then-reveal happens entirely off-screen with no flash.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // "static" → visible, no animation (the safe default + SSR output).
  // "hidden" → armed just below the fold, waiting; hidden WITHOUT a transition.
  // "shown"  → animating/animated into place (transition lives only here, so
  //            arming never fades out — only the reveal animates).
  const [phase, setPhase] = React.useState<"static" | "hidden" | "shown">(
    "static",
  );

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Bail to plain-visible when motion is unwanted or unsupported.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Only animate what's still clearly below the fold. Anything already on (or
    // above) the screen — including content loaded at a restored scroll
    // position or via a #hash link — stays put, so the visitor never sees a
    // hide/flash and nothing can be left stranded off-screen-above.
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    if (node.getBoundingClientRect().top < viewportH * 0.85) return;

    setPhase("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("shown");
          observer.disconnect();
        }
      },
      // threshold 0 → fire as soon as a single pixel crosses the line, so tall
      // sections on short viewports always trigger. The -10% bottom margin
      // holds the reveal until the element is a touch into view.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={phase === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "motion-reduce:transition-none",
        // Transition exists only for the reveal, so arming hides instantly.
        phase === "shown" &&
          "transition-[opacity,transform] duration-500 ease-out",
        phase === "hidden"
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
