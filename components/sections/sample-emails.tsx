"use client";

import * as React from "react";
import { Sunrise, StickyNote, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { site } from "@/lib/config";

type SampleEmail = {
  /** Stable id + the label shown on the selector pill. */
  id: string;
  pill: string;
  to: string;
  time: string;
  subject: string;
  /** Body paragraphs, in order. */
  body: string[];
  /** The free-text reminders this person set for themselves during setup. */
  notes: string[];
  tone: string;
  theme: string;
  goal: string;
};

// Three lives, three tones. The reminders under each are the new bit: free
// text the person typed at setup, echoed back to them verbatim every morning.
const EMAILS: SampleEmail[] = [
  {
    id: "shape",
    pill: "Back in shape",
    to: "Sam",
    time: "6:15 AM",
    subject: "Twenty minutes. That’s the whole ask.",
    body: [
      "Morning, Sam. Day twelve, which is right about when the excuses get inventive. Heard them all, none of them are new. Still twenty minutes.",
      "You don’t need a good workout. You need your shoes on and the door shut behind you before your brain finishes its case for the couch. Sloppy and done beats perfect and skipped.",
      "Let's GO! The version of you from week one wouldn’t believe you’re still here.",
    ],
    notes: ["Drink more water", "Do 10 pushups NOW"],
    tone: "Direct",
    theme: "Consistency",
    goal: "Move every day",
  },
  {
    id: "calm",
    pill: "Calmer mornings",
    to: "Priya",
    time: "6:45 AM",
    subject: "Before the house wakes up",
    body: [
      "Good Morning, Priya. For the next ten minutes nobody has lost a shoe, nobody needs a snack, and the word “mom” hasn’t been yelled once. It’s a fragile peace. Enjoy it.",
      "You’re not going to find an hour of calm today and we both know it. So take the ninety seconds you’ve got — warm mug, both feet on the floor, nobody hanging off your leg. That’s the whole assignment.",
      "The chaos is coming, and you’ve handled every morning before this one. But not yet. Finish the coffee first.",
    ],
    notes: ["Relax your shoulders, watch your posture :))", "One slow breath before the school run"],
    tone: "Playful",
    theme: "Calm",
    goal: "Find pockets of quiet",
  },
  {
    id: "steady",
    pill: "Steady days",
    to: "Eli",
    time: "9:30 AM",
    subject: "Just the next small thing",
    body: [
      "Morning, Eli. You don’t have to sort out the whole day before you’re even out of bed. That’s a lot to ask of anyone, let alone before you’ve had water.",
      "So pick one small thing. Open the curtains. Answer one message. On a heavy day that isn’t nothing — that’s the win, and you’re allowed to count it as one.",
      "Tomorrow can be tomorrow’s. Right now it’s only you and the next few minutes, and those you can do.",
    ],
    notes: ["Drink some water", "Open the curtains", "Text one person back"],
    tone: "Gentle",
    theme: "One small step",
    goal: "Get back to steady",
  },
];

// Tracks the sm breakpoint (640px) so the deck can lay out differently on
// phones. Starts desktop so SSR + first paint are deterministic; corrects on
// mount (the stack just animates into place, which reads as intentional).
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

// Transform for a card at a given depth in the deck (0 = front).
// Desktop fans the back cards out so their corners peek and lift on hover;
// mobile keeps them squared up and tucked behind, peeking only at the bottom,
// so nothing rotates past the section's clipped edges on a narrow screen.
function deckTransform(depth: number, lifted: boolean, isMobile: boolean) {
  if (depth === 0) {
    return {
      transform: "translate(0px, 0px) rotate(0deg) scale(1)",
      opacity: 1,
      zIndex: 30,
      transformOrigin: isMobile ? "top center" : "center center",
    };
  }

  if (isMobile) {
    // Straight vertical stack — like sheets on a desk, top edges aligned.
    const y = depth === 1 ? 34 : 64;
    const scale = depth === 1 ? 0.95 : 0.9;
    return {
      transform: `translate(0px, ${y}px) scale(${scale})`,
      opacity: depth === 1 ? 0.55 : 0.35,
      zIndex: depth === 1 ? 20 : 10,
      transformOrigin: "top center",
    };
  }

  if (depth === 1) {
    return {
      transform: `translate(-22px, ${lifted ? 4 : 16}px) rotate(-7deg) scale(0.95)`,
      opacity: lifted ? 0.92 : 0.6,
      zIndex: 20,
      transformOrigin: "center center",
    };
  }
  return {
    transform: `translate(22px, ${lifted ? 14 : 30}px) rotate(7deg) scale(0.9)`,
    opacity: lifted ? 0.92 : 0.4,
    zIndex: 10,
    transformOrigin: "center center",
  };
}

export function SampleEmails() {
  const [activeId, setActiveId] = React.useState(EMAILS[0].id);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const isMobile = useIsMobile();
  const activeIndex = EMAILS.findIndex((e) => e.id === activeId);

  // Step the deck forward/back, wrapping around either end.
  const go = (dir: number) =>
    setActiveId(EMAILS[(activeIndex + dir + EMAILS.length) % EMAILS.length].id);

  // Swipe to switch on touch. We never preventDefault, so vertical page
  // scrolling stays untouched; only a clearly horizontal flick counts.
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div>
      {/* Selector pills — the accessible, keyboard-friendly control. */}
      <div className="mb-5 flex flex-wrap justify-center gap-2 sm:mb-8">
        {EMAILS.map((email) => {
          const active = email.id === activeId;
          return (
            <button
              key={email.id}
              type="button"
              onClick={() => setActiveId(email.id)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/70 text-ink-soft hover:border-primary/40 hover:text-ink",
              )}
            >
              {email.pill}
            </button>
          );
        })}
      </div>

      {/* The deck. All cards share one grid cell, so the container height is
          always the tallest card's — it never changes when you switch, which
          keeps the arrows and everything below from jumping. The transforms are
          purely visual and don't affect layout. */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative grid touch-pan-y grid-cols-1 items-start px-3 pb-8 sm:px-12"
      >
        {/* Desktop prev/next, tucked into the gutters either side of the deck. */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous email"
          className="absolute left-0 top-1/2 z-40 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-ink sm:flex"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next email"
          className="absolute right-0 top-1/2 z-40 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-ink sm:flex"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>

        {EMAILS.map((email, i) => {
          const depth = (i - activeIndex + EMAILS.length) % EMAILS.length;
          const isFront = depth === 0;
          const lifted = !isMobile && hoveredId === email.id && !isFront;
          const { transform, opacity, zIndex, transformOrigin } = deckTransform(
            depth,
            lifted,
            isMobile,
          );

          return (
            <article
              key={email.id}
              onClick={isFront ? undefined : () => setActiveId(email.id)}
              onMouseEnter={() => !isFront && setHoveredId(email.id)}
              onMouseLeave={() => setHoveredId((id) => (id === email.id ? null : id))}
              aria-hidden={!isFront}
              style={{ transform, opacity, zIndex, transformOrigin }}
              className={cn(
                "col-start-1 row-start-1 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(42,33,24,0.35)] transition-[transform,opacity] duration-500 ease-out will-change-transform",
                !isFront && "cursor-pointer",
              )}
            >
              {/* Email header / chrome */}
              <header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-5 py-4 sm:px-7">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sunrise className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {site.name}{" "}
                    <span className="font-normal text-ink-soft">
                      &lt;{site.contactEmail}&gt;
                    </span>
                  </p>
                  <p className="truncate text-xs text-ink-soft">to {email.to}</p>
                </div>
                <time className="shrink-0 text-xs text-ink-soft">{email.time}</time>
              </header>

              {/* Subject */}
              <div className="border-b border-border px-5 py-4 sm:px-7">
                <h3 className="font-display text-xl font-medium text-ink">
                  {email.subject}
                </h3>
              </div>

              {/* Body */}
              <div className="space-y-4 px-5 py-7 text-[15px] leading-relaxed text-ink sm:px-7 sm:text-base">
                {email.body.map((para, p) => (
                  <p key={p}>{para}</p>
                ))}

                {/* The user's own reminders, echoed back verbatim. */}
                <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    <StickyNote className="size-3.5" aria-hidden />
                    Direct message from you to you
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {email.notes.map((note) => (
                      <li key={note} className="flex items-start gap-2 text-sm text-ink">
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold"
                          aria-hidden
                        />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-ink-soft">{site.name}</p>
              </div>

              {/* "How it stays personal" meta strip */}
              <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-secondary/40 px-5 py-3 text-xs text-ink-soft sm:px-7">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  Tone: {email.tone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  Today’s theme: {email.theme}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  Goal: {email.goal}
                </span>
              </footer>
            </article>
          );
        })}
      </div>

      {/* Mobile controls — arrows with page dots, since the back cards only
          peek a sliver and are fiddly to tap directly. */}
      <div className="mt-6 flex items-center justify-center gap-5 sm:hidden">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous email"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-ink-soft transition-colors active:bg-secondary"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          {EMAILS.map((email) => {
            const active = email.id === activeId;
            return (
              <button
                key={email.id}
                type="button"
                onClick={() => setActiveId(email.id)}
                aria-label={`Show ${email.pill}`}
                aria-current={active}
                className={cn(
                  "h-2 rounded-full transition-all",
                  active ? "w-5 bg-primary" : "w-2 bg-ink/20",
                )}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next email"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-ink-soft transition-colors active:bg-secondary"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <p className="mt-4 hidden text-center text-xs text-ink-soft sm:block">
        Click a card or use the arrows to switch.
      </p>
    </div>
  );
}
