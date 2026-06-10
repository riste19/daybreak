"use client";

import { universalQuestions, type Tone } from "@/lib/onboarding/onboarding-schema";
import type { AnswerValue } from "@/lib/onboarding/resolveAnswers";
import { QuestionRenderer } from "./question-renderer";

interface UniversalStepProps {
  values: Record<string, AnswerValue>;
  onChange: (questionId: string, value: AnswerValue | undefined) => void;
  /** Tone derived from category answers — shown pre-selected, editable. */
  suggestedTone: Tone;
}

/** The short closing step: name + the one required goal + tone + send time + note. */
export function UniversalStep({ values, onChange, suggestedTone }: UniversalStepProps) {
  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-2xl font-medium text-ink">A few last touches</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Just one line is required — the rest is yours to shape or skip.
        </p>
      </header>

      <div className="space-y-7">
        {universalQuestions.map((q) => (
          <div key={q.id}>
            {q.required && (
              <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Required
              </span>
            )}
            <QuestionRenderer
              question={q}
              value={values[q.id]}
              onChange={(v) => onChange(q.id, v)}
              suggestedValue={q.id === "universal.tone" ? suggestedTone : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
