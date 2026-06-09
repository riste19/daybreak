"use client";

import { Sunrise, Pencil } from "lucide-react";

import { getCategory } from "@/lib/onboarding/onboarding-schema";
import type { AnswerValue, ResolvedAnswers } from "@/lib/onboarding/resolveAnswers";

interface ConfirmationProps {
  selected: string[];
  values: Record<string, AnswerValue>;
  resolved: ResolvedAnswers;
  onEditCategories: () => void;
  onEditCategory: (id: string) => void;
  onEditUniversal: () => void;
}

const SEND_TIMES: Record<string, string> = {
  early: "6:00am",
  dawn: "7:00am",
  mid: "8:00am",
};

function asText(v: AnswerValue | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function Confirmation({
  selected,
  values,
  resolved,
  onEditCategories,
  onEditCategory,
  onEditUniversal,
}: ConfirmationProps) {
  const name = asText(values["universal.name"]);
  const goal = asText(values["universal.goal"]);
  const email = asText(values["universal.email"]);
  const note = asText(values["universal.note"]);
  const time = SEND_TIMES[String(values["universal.sendTime"] ?? "dawn")] ?? "7:00am";

  return (
    <div className="text-center">
      <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Sunrise className="size-8" aria-hidden />
      </span>

      <h2 className="font-display text-3xl font-medium text-ink">
        {name ? `You're all set, ${name}.` : "You're all set."}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
        Your first email arrives tomorrow at{" "}
        <span className="font-medium text-ink">{time}</span>
        {email ? (
          <>
            {" "}
            at <span className="font-medium text-ink">{email}</span>
          </>
        ) : null}
        .
      </p>

      {/* A quiet summary of what they told us, with edit affordances. */}
      <div className="mx-auto mt-9 max-w-md space-y-3 text-left">
        <SummaryRow label="Your goal" onEdit={onEditUniversal}>
          {goal ?? <span className="text-ink-soft">—</span>}
        </SummaryRow>

        <SummaryRow label="Sending to" onEdit={onEditUniversal}>
          {email ?? <span className="text-ink-soft">—</span>}
        </SummaryRow>

        <SummaryRow label="Tone" onEdit={onEditUniversal}>
          <span className="capitalize">{resolved.params.tone}</span>
        </SummaryRow>

        <SummaryRow label="Focusing on" onEdit={onEditCategories}>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((id) => {
              const cat = getCategory(id);
              if (!cat) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onEditCategory(id)}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-primary/10"
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </SummaryRow>

        {note && (
          <SummaryRow label="A note for your mornings" onEdit={onEditUniversal}>
            <span className="text-ink-soft">{note}</span>
          </SummaryRow>
        )}

        <p className="px-1 pt-2 text-center text-sm text-ink-soft">
          We&apos;ll shape each morning from {resolved.contextLines.length} thing
          {resolved.contextLines.length === 1 ? "" : "s"} you shared. You can change
          any of it anytime.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft">
          {label}
        </div>
        <div className="mt-1 text-ink">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-secondary"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}
