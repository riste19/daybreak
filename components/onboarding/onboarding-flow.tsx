"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { usePostHog } from "@/components/analytics/posthog-context";

import { cn } from "@/lib/utils";
import { site } from "@/lib/config";
import { categories } from "@/lib/onboarding/onboarding-schema";
import { resolveAnswers, type AnswerValue } from "@/lib/onboarding/resolveAnswers";
import { buildGenerationInput, type GenerationInput } from "@/lib/onboarding/buildGenerationInput";
import { DEFAULT_LAYOUT, type EmailLayout } from "@/lib/email/layout";
import { isValidEmail } from "@/lib/validation";
import { wakeEngine } from "@/lib/wake-engine";
import { captureTrialLead } from "@/app/start/actions";
import { Button } from "@/components/ui/button";
import { CategoryGrid } from "./category-grid";
import { CategoryStep } from "./category-step";
import { UniversalStep } from "./universal-step";
import { DebugReview } from "./debug-review";
import { ReviewSend } from "./review-send";
import { CustomizeScreen } from "@/components/email-builder/customize-screen";
import { ProgressDots } from "./progress-dots";

type Values = Record<string, AnswerValue>;

/** Keep the start light: pick up to this many focus areas. */
const MAX_CATEGORIES = 3;

/**
 * The whole onboarding flow. Renders entirely from the schema:
 *   intro (pick categories) → one calm screen per chosen category → universal → done.
 *
 * Navigation index runs over [intro, ...selectedCategories, universal]. The
 * confirmation screen is shown once `submitted` is true.
 */
export function OnboardingFlow({ isOwner = false }: { isOwner?: boolean }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [values, setValues] = React.useState<Values>({});
  const [index, setIndex] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [input, setInput] = React.useState<GenerationInput | null>(null);
  // Post-questionnaire: customize the email layout, then review & send.
  const [stage, setStage] = React.useState<"customize" | "review">("customize");
  const [emailLayout, setEmailLayout] = React.useState<EmailLayout>(DEFAULT_LAYOUT);

  const topRef = React.useRef<HTMLDivElement>(null);
  const posthog = usePostHog();

  // Funnel: record that the questionnaire was opened (once per mount).
  const viewed = React.useRef(false);
  React.useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    posthog?.capture("start_viewed");
  }, [posthog]);

  // Wake the engine (it sleeps when idle and takes ~50 s to wake) while the
  // visitor answers, so the final send isn't stuck behind a cold start.
  React.useEffect(() => {
    wakeEngine();
  }, []);

  // Keep selected categories in schema order so steps + dots are predictable.
  const toggleCategory = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CATEGORIES) return prev; // at cap — ignore.
      return categories.filter((c) => prev.includes(c.id) || c.id === id).map((c) => c.id);
    });
  };

  const setAnswer = (questionId: string, value: AnswerValue | undefined) => {
    setValues((prev) => {
      if (value === undefined) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: value };
    });
  };

  // index → which screen. 0 = intro, then categories, then universal.
  const universalIndex = selected.length + 1;
  const goal = typeof values["universal.goal"] === "string" ? values["universal.goal"].trim() : "";
  const email = typeof values["universal.email"] === "string" ? values["universal.email"] : "";
  const hasGoal = goal.length > 0;
  const hasEmail = isValidEmail(email);
  const canSubmit = selected.length >= 1 && hasGoal && hasEmail;
  // What's still missing, for a helpful submit-disabled hint.
  const submitHint = !hasGoal
    ? "Add a one-line goal to finish."
    : !hasEmail
      ? "Add the email address to send to."
      : "";

  // Live preview of the resolved tone, used to pre-fill the tone question.
  const suggestedTone = React.useMemo(
    () => resolveAnswers({ selectedCategories: selected, values }).params.tone,
    [selected, values],
  );

  const goTo = (next: number) => {
    setIndex(next);
    // Scroll the panel back to the top on each step (mobile-friendly).
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  const handleSubmit = () => {
    // The key funnel conversion: the visitor finished the questionnaire with a
    // goal + email. (categories/tone are useful breakdown properties.)
    posthog?.capture("onboarding_completed", {
      categories: selected.length,
      tone: suggestedTone,
    });
    // Capture the email + answers as a pre-registration lead (fire-and-forget;
    // server no-ops without Supabase). Lets us see trial→paid conversion and
    // pre-fill the account if this email subscribes later.
    void captureTrialLead({
      email: email.trim(),
      selectedCategories: selected,
      values,
      distinctId: posthog?.get_distinct_id?.() ?? null,
    });
    // Map answers to the engine's request body. Email/sendTime are delivery
    // metadata and deliberately NOT part of GenerationInput.
    setInput(buildGenerationInput({ selectedCategories: selected, values }));
    setStage("customize");
    setSubmitted(true);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  /* ───────────────── Customize → Review (post-questionnaire) ──────────── */
  if (submitted && input) {
    const backToQuestions = () => {
      setSubmitted(false);
      goTo(universalIndex);
    };
    return (
      <Shell topRef={topRef} full>
        <div key={stage} className="animate-dawn-rise">
          {stage === "customize" ? (
            <CustomizeScreen
              input={input}
              layout={emailLayout}
              onChange={setEmailLayout}
              onBack={backToQuestions}
              onContinue={() => {
                setStage("review");
                requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
              }}
            />
          ) : isOwner ? (
            <DebugReview
              input={input}
              emailLayout={emailLayout}
              to={email.trim()}
              onBackToEdit={() => setStage("customize")}
            />
          ) : (
            <ReviewSend
              input={input}
              emailLayout={emailLayout}
              to={email.trim()}
              onBackToEdit={() => setStage("customize")}
            />
          )}
        </div>
      </Shell>
    );
  }

  /* ─────────────────────────────── Intro ────────────────────────────── */
  if (index === 0) {
    return (
      <Shell topRef={topRef} wide>
        {/* Keyed so the calm rise replays whenever we land back here — e.g.
            tapping Back on the first question. */}
        <div key={index} className="animate-dawn-rise">
          <header className="mb-7 text-center">
            <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
              What should your mornings focus on?
            </h1>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">
              Pick what you want {site.name} to focus on, up to {MAX_CATEGORIES}.
              Even one is plenty.
            </p>
          </header>

          <CategoryGrid
            selected={selected}
            onToggle={toggleCategory}
            max={MAX_CATEGORIES}
          />

          <p className="mt-5 text-center text-sm text-ink-soft">
            {selected.length >= MAX_CATEGORIES
              ? `That's ${MAX_CATEGORIES}, a lovely place to start. You can change this anytime.`
              : "You can change this anytime."}
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Button
              size="lg"
              disabled={selected.length === 0}
              onClick={() => goTo(1)}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ───────────────────────── Category screens ───────────────────────── */
  if (index <= selected.length) {
    const categoryId = selected[index - 1];
    const isLastCategory = index === selected.length;
    return (
      <Shell topRef={topRef}>
        <StepBar active={index - 1} total={selected.length + 1} />

        {/* `key` forces a remount each step so the calm rise replays — the
            same entrance the hero uses. */}
        <div key={index} className="animate-dawn-rise">
          <CategoryStep categoryId={categoryId} values={values} onChange={setAnswer} />
        </div>

        <NavBar
          onBack={() => goTo(index - 1)}
          onSkip={() => goTo(index + 1)}
          onNext={() => goTo(index + 1)}
          nextLabel={isLastCategory ? "Last touches" : "Next"}
          canFinish={canSubmit}
          onFinish={() => goTo(universalIndex)}
        />
      </Shell>
    );
  }

  /* ────────────────────────── Universal step ────────────────────────── */
  return (
    <Shell topRef={topRef}>
      <StepBar active={selected.length} total={selected.length + 1} />

      <div key={index} className="animate-dawn-rise">
        <UniversalStep values={values} onChange={setAnswer} suggestedTone={suggestedTone} />
      </div>

      <div className="mt-9 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => goTo(index - 1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex flex-col items-end gap-1.5">
          <Button size="lg" variant="glow" disabled={!canSubmit} onClick={handleSubmit}>
            <Check className="size-4" />
            See my mornings
          </Button>
          {!canSubmit && submitHint && (
            <span className="text-xs text-ink-soft">{submitHint}</span>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────────────────── Layout shell ─────────────────────────── */

function Shell({
  children,
  topRef,
  wide = false,
  full = false,
}: {
  children: React.ReactNode;
  topRef: React.RefObject<HTMLDivElement | null>;
  /** Intro uses a roomier container so the category cards aren't cramped. */
  wide?: boolean;
  /** Debug review goes nearly full-width so the prompt/JSON panels can breathe. */
  full?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div ref={topRef} className="scroll-mt-6" />
      <div
        className={cn(
          "mx-auto flex min-h-dvh flex-col px-5 py-6 sm:py-10",
          full ? "max-w-400" : wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <TopChrome />
        <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
      </div>
    </div>
  );
}

function TopChrome() {
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/"
        className="font-display text-lg font-medium text-ink transition-opacity hover:opacity-70"
      >
        {site.name}
      </Link>
      <span className="text-xs text-ink-soft">You can stop anytime</span>
    </div>
  );
}

function StepBar({ active, total }: { active: number; total: number }) {
  return (
    <div className="mb-8 flex justify-center">
      <ProgressDots active={active} total={total} />
    </div>
  );
}

/* ─────────────────────── Category screen nav row ────────────────────── */

function NavBar({
  onBack,
  onSkip,
  onNext,
  nextLabel,
  canFinish,
  onFinish,
}: {
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  nextLabel: string;
  canFinish: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="mt-9 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip this
          </Button>
          <Button onClick={onNext}>
            {nextLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Ever-present escape hatch once a goal can be added & submitted. */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onFinish}
          className={cn(
            "text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline",
          )}
        >
          {canFinish ? "Finish now" : "Skip to the finish"} →
        </button>
      </div>
    </div>
  );
}
