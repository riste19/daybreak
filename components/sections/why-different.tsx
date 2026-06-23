import { UserRound, RefreshCw, MoonStar, Settings2 } from "lucide-react";

import { Reveal } from "@/components/reveal";

const reasons = [
  {
    icon: UserRound,
    title: "It’s actually about you",
    body: "Every email is built from your goal and what’s on your plate that week. A quotes app sends the same line to ten thousand people; this one only knows about you.",
  },
  {
    icon: RefreshCw,
    title: "It won’t repeat itself",
    body: "It keeps track of what it’s already said and moves between themes, so the email on day 30 doesn’t read like day 3 reheated.",
  },
  {
    icon: MoonStar,
    title: "It stays in your inbox",
    body: "No notifications, nothing buzzing for your attention. It shows up once in the morning and then leaves you alone until tomorrow.",
  },
  {
    icon: Settings2,
    title: "Easy to walk away from",
    body: "Change the tone, move the send time, or pause for a while. Unsubscribing takes two clicks, and we won’t chase you about it.",
  },
];

export function WhyDifferent() {
  return (
    <section id="why" className="bg-cream px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why it’s different
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            It’s email. That’s sort of the point.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {reasons.map((reason, i) => (
            <Reveal key={reason.title} delay={(i % 2) * 120}>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-7 shadow-sm">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <reason.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{reason.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{reason.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
