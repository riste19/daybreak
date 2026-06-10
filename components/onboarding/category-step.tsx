"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getCategory,
  type Question,
  type ShowIf,
} from "@/lib/onboarding/onboarding-schema";
import type { AnswerValue } from "@/lib/onboarding/resolveAnswers";
import { iconMap } from "./icon-map";
import { QuestionRenderer } from "./question-renderer";

interface CategoryStepProps {
  categoryId: string;
  values: Record<string, AnswerValue>;
  onChange: (questionId: string, value: AnswerValue | undefined) => void;
}

/** Evaluate a showIf predicate against current answers (UI-side mirror of the resolver). */
function passesShowIf(showIf: ShowIf, values: Record<string, AnswerValue>): boolean {
  const v = values[showIf.questionId];
  if (v == null || (Array.isArray(v) && v.length === 0) || v === "") return false;
  switch (showIf.operator) {
    case "equals":
      return v === showIf.value;
    case "includes":
      return Array.isArray(v) && v.includes(showIf.value as string);
    case "gt":
      return Number(v) > Number(showIf.value);
    case "lt":
      return Number(v) < Number(showIf.value);
    default:
      return false;
  }
}

/**
 * One calm screen per category: the surface questions, plus an optional,
 * collapsed "Get more specific" disclosure for the deeper ones.
 */
export function CategoryStep({ categoryId, values, onChange }: CategoryStepProps) {
  const category = getCategory(categoryId);
  const [expanded, setExpanded] = React.useState(false);

  if (!category) return null;
  const Icon = iconMap[category.icon];

  const surface = category.questions.filter((q) => q.depth === "surface");
  const deeper = category.questions.filter((q) => q.depth === "deeper");

  const renderQuestion = (q: Question, conditional = false) => {
    // Conditional questions only render once their predicate passes.
    if (q.showIf && !passesShowIf(q.showIf, values)) return null;
    return (
      <div
        key={q.id}
        className={cn(conditional || q.showIf ? "animate-reveal" : undefined)}
      >
        <QuestionRenderer
          question={q}
          value={values[q.id]}
          onChange={(v) => onChange(q.id, v)}
        />
      </div>
    );
  };

  return (
    <div>
      <header className="mb-7 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          {Icon ? <Icon className="size-6" aria-hidden /> : null}
        </span>
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">{category.label}</h2>
          <p className="text-sm text-ink-soft">{category.description}</p>
        </div>
      </header>

      <div className="space-y-7">{surface.map((q) => renderQuestion(q))}</div>

      {deeper.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary/60"
          >
            {expanded ? <Minus className="size-4" /> : <Plus className="size-4" />}
            {expanded ? "Less" : "Get more specific"}
          </button>

          {expanded && (
            <div className="animate-reveal mt-7 space-y-7 border-t border-border pt-7">
              {deeper.map((q) => renderQuestion(q, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
