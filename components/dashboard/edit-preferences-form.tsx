"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Check, Loader2, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { categories, universalQuestions } from "@/lib/onboarding/onboarding-schema";
import { resolveAnswers, type AnswerValue } from "@/lib/onboarding/resolveAnswers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryGrid } from "@/components/onboarding/category-grid";
import { CategoryStep } from "@/components/onboarding/category-step";
import { QuestionRenderer } from "@/components/onboarding/question-renderer";
import { savePreferences } from "@/app/dashboard/edit/actions";
import { initialEditState } from "@/app/dashboard/edit/edit-state";

/** Keep it light: focus on up to this many life areas (matches onboarding). */
const MAX_CATEGORIES = 3;

const nameQuestion = universalQuestions.find((q) => q.id === "universal.name");
// The closing fields, minus the two that live on `users` (name, email).
const closingQuestions = universalQuestions.filter(
  (q) => q.id !== "universal.name" && q.id !== "universal.email",
);

interface EditPreferencesFormProps {
  /** The signed-in address — shown read-only (it's the login + delivery identity). */
  email: string;
  initialSelected: string[];
  initialValues: Record<string, AnswerValue>;
}

/**
 * The advanced, single-page morning editor. Everything is visible at once and
 * grouped into sections — distinct from the step-by-step /start wizard. Reuses
 * the onboarding renderers, so deep per-category questions come along for free.
 *
 * The dynamic answer set is serialized into one hidden `payload` field; the
 * Server Action re-derives the stored columns from it (never trusting the client).
 */
export function EditPreferencesForm({
  email,
  initialSelected,
  initialValues,
}: EditPreferencesFormProps) {
  const [selected, setSelected] = React.useState<string[]>(initialSelected);
  const [values, setValues] = React.useState<Record<string, AnswerValue>>(initialValues);
  const [state, formAction, pending] = useActionState(savePreferences, initialEditState);

  const toggleCategory = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CATEGORIES) return prev; // at cap — ignore
      // Keep selection in schema order so the category cards are predictable.
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

  // Live tone suggestion (pre-selects the tone chip when it's unset).
  const suggestedTone = React.useMemo(
    () => resolveAnswers({ selectedCategories: selected, values }).params.tone,
    [selected, values],
  );

  const goal =
    typeof values["universal.goal"] === "string" ? values["universal.goal"].trim() : "";
  const canSave = selected.length >= 1 && goal.length > 0;
  const hint = selected.length < 1
    ? "Pick at least one focus area."
    : goal.length < 1
      ? "Add your one-line goal."
      : "";

  const payload = React.useMemo(
    () => JSON.stringify({ selectedCategories: selected, values }),
    [selected, values],
  );

  return (
    <form action={formAction} className="mt-9 space-y-6">
      <input type="hidden" name="payload" value={payload} />

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <Section title="You">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="edit-email"
              className="mb-2 block font-display text-lg font-medium text-ink"
            >
              Email
            </label>
            <div className="relative">
              <Input
                id="edit-email"
                value={email}
                readOnly
                disabled
                aria-label="Your email (read-only)"
                className="pr-10 opacity-80"
              />
              <Lock
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              Your sign-in and delivery address. Contact us if you need to change it.
            </p>
          </div>

          {nameQuestion && (
            <QuestionRenderer
              question={nameQuestion}
              value={values[nameQuestion.id]}
              onChange={(v) => setAnswer(nameQuestion.id, v)}
            />
          )}
        </div>
      </Section>

      {/* ── Focus areas ─────────────────────────────────────────────────── */}
      <Section
        title="Focus areas"
        description={`What your mornings center on, choose up to ${MAX_CATEGORIES}.`}
      >
        <CategoryGrid selected={selected} onToggle={toggleCategory} max={MAX_CATEGORIES} />
      </Section>

      {/* ── One card per chosen area (surface + deeper questions) ────────── */}
      {selected.map((id) => (
        <div
          key={id}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7"
        >
          <CategoryStep categoryId={id} values={values} onChange={setAnswer} />
        </div>
      ))}

      {/* ── Voice, timing & goal ────────────────────────────────────────── */}
      <Section title="Voice, timing & goal">
        <div className="space-y-7">
          {closingQuestions.map((q) => (
            <div key={q.id}>
              {q.required && (
                <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Required
                </span>
              )}
              <QuestionRenderer
                question={q}
                value={values[q.id]}
                onChange={(v) => setAnswer(q.id, v)}
                suggestedValue={q.id === "universal.tone" ? suggestedTone : undefined}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Sticky save bar ─────────────────────────────────────────────── */}
      <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={cn(
              "mb-3 flex items-center gap-1.5 text-sm",
              state.status === "error" ? "text-destructive" : "text-primary",
            )}
          >
            {state.status === "success" && <Check className="size-4" aria-hidden />}
            {state.message}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <div className="flex flex-col items-end gap-1.5">
            <Button type="submit" variant="glow" disabled={!canSave || pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden />
                  Save changes
                </>
              )}
            </Button>
            {!canSave && hint && <span className="text-xs text-ink-soft">{hint}</span>}
          </div>
        </div>
      </div>
    </form>
  );
}

/* ───────────────────────────── Section card ─────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <div className="mb-5">
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {children}
    </section>
  );
}
