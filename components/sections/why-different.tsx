import { UserRound, RefreshCw, MoonStar, Settings2 } from "lucide-react";

import { Reveal } from "@/components/reveal";

const reasons = [
  {
    icon: UserRound,
    title: "Personal, not generic",
    body: "Written around your goals and your tasks — not a one-size-fits-all quote pulled from a database.",
  },
  {
    icon: RefreshCw,
    title: "Never repetitive",
    body: "It remembers what it already said and rotates between themes, so day 30 feels as fresh as day 1.",
  },
  {
    icon: MoonStar,
    title: "Calm by design",
    body: "It lives in your inbox, on your schedule. No notifications, no feed, no algorithm fighting for your attention.",
  },
  {
    icon: Settings2,
    title: "You’re in control",
    body: "Choose your tone and send time. Pause, change, or stop whenever you like — no friction, no guilt.",
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
            Not another app demanding your attention.
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
