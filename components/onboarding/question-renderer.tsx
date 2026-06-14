"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CAPS, type Question } from "@/lib/onboarding/onboarding-schema";
import type { AnswerValue } from "@/lib/onboarding/resolveAnswers";
import { isValidEmail } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  /** Visual suggestion shown as pre-selected when value is unset (tone). */
  suggestedValue?: string;
}

/**
 * Renders a single question by its input type. Knows nothing about any specific
 * question — purely schema-driven, so new questions need no changes here.
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
  suggestedValue,
}: QuestionRendererProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 block font-display text-lg font-medium text-ink">
        {question.label}
      </legend>
      {question.help && (
        <p className="-mt-2 mb-3 text-sm text-ink-soft">{question.help}</p>
      )}

      <QuestionControl
        question={question}
        value={value}
        onChange={onChange}
        suggestedValue={suggestedValue}
      />
    </fieldset>
  );
}

function QuestionControl({
  question,
  value,
  onChange,
  suggestedValue,
}: QuestionRendererProps) {
  switch (question.input) {
    case "single_select":
      return (
        <ChipGroup
          options={question.options ?? []}
          selected={
            typeof value === "string"
              ? [value]
              : suggestedValue
                ? [suggestedValue]
                : []
          }
          dimWhenSuggested={value == null && suggestedValue != null}
          onToggle={(v) => onChange(value === v ? undefined : v)}
        />
      );

    case "multi_select":
    case "chip_multi": {
      const arr = Array.isArray(value) ? value : [];
      const atCap = arr.length >= CAPS.multi;
      return (
        <>
          <ChipGroup
            options={question.options ?? []}
            selected={arr}
            disabledUnselected={atCap}
            onToggle={(v) => {
              if (arr.includes(v)) onChange(arr.filter((x) => x !== v));
              else if (!atCap) onChange([...arr, v]);
            }}
          />
          {atCap && (
            <p className="mt-2 text-xs text-ink-soft">
              Pick up to {CAPS.multi} — that&apos;s plenty.
            </p>
          )}
        </>
      );
    }

    case "scale": {
      const { min = 1, max = 5, minLabel, maxLabel } = question.scale ?? {};
      const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div>
          <div className="flex gap-2">
            {nums.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={value === n}
                onClick={() => onChange(value === n ? undefined : n)}
                className={cn(
                  "h-12 flex-1 cursor-pointer rounded-xl border text-base font-medium transition-colors",
                  value === n
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-ink-soft hover:border-primary/40",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {(minLabel || maxLabel) && (
            <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
          )}
        </div>
      );
    }

    case "short_text": {
      const cap = question.maxLength ?? CAPS.text;
      const text = typeof value === "string" ? value : "";
      const long = cap > 140;
      const Field = long ? Textarea : Input;
      return (
        <div>
          <Field
            value={text}
            maxLength={cap}
            placeholder={question.placeholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange(e.target.value === "" ? undefined : e.target.value)
            }
            aria-label={question.label}
          />
          {long && (
            <p className="mt-1 text-right text-xs text-ink-soft">
              {text.length}/{cap}
            </p>
          )}
        </div>
      );
    }

    case "email": {
      const text = typeof value === "string" ? value : "";
      return (
        <EmailField
          value={text}
          maxLength={question.maxLength ?? 254}
          placeholder={question.placeholder}
          ariaLabel={question.label}
          onChange={(v) => onChange(v === "" ? undefined : v)}
        />
      );
    }

    case "time": {
      const text = typeof value === "string" ? value : "";
      return (
        <TimeField
          value={text}
          ariaLabel={question.label}
          onChange={(v) => onChange(v || undefined)}
        />
      );
    }

    case "timezone": {
      const text = typeof value === "string" ? value : "";
      return (
        <TimezoneField
          value={text}
          ariaLabel={question.label}
          onChange={(v) => onChange(v || undefined)}
        />
      );
    }

    default:
      return null;
  }
}

/* ─────────────────────────────── Time field ─────────────────────────────── */

/** Native time picker (any minute). Seeds a friendly 7:00am default when unset. */
function TimeField({
  value,
  ariaLabel,
  onChange,
}: {
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  React.useEffect(() => {
    if (!value) onChange("07:00");
    // Seed once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Input
      type="time"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-44"
    />
  );
}

/* ───────────────────────────── Timezone field ───────────────────────────── */

const FALLBACK_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Skopje",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function supportedTimezones(): string[] {
  const sv = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf;
  if (typeof sv === "function") {
    try {
      const list = sv("timeZone");
      if (Array.isArray(list) && list.length) return list;
    } catch {
      /* fall through to the curated list */
    }
  }
  return FALLBACK_TIMEZONES;
}

/**
 * IANA timezone select. Defaults to the browser's zone (set in an effect, so the
 * server-rendered markup matches — no hydration mismatch). The full supported zone
 * list comes from Intl, with a curated fallback for older runtimes.
 */
function TimezoneField({
  value,
  ariaLabel,
  onChange,
}: {
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  const zones = React.useMemo(() => {
    const list = supportedTimezones();
    const out = list.includes("UTC") ? [...list] : ["UTC", ...list];
    // Keep an unrecognized stored value selectable.
    if (value && !out.includes(value)) out.unshift(value);
    return out;
  }, [value]);

  React.useEffect(() => {
    if (!value) onChange(detectTimezone());
    // Seed the detected zone once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-11 w-full max-w-md rounded-2xl border border-border bg-card px-3 text-sm text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {!value && (
        <option value="" disabled>
          Detecting your time zone…
        </option>
      )}
      {zones.map((z) => (
        <option key={z} value={z}>
          {z.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

/* ───────────────────────────── Email field ──────────────────────────── */

function EmailField({
  value,
  maxLength,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: string;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  // Only flag an invalid address after the user has left the field — never
  // nag them mid-typing.
  const [touched, setTouched] = React.useState(false);
  const invalid = touched && value.trim() !== "" && !isValidEmail(value);

  return (
    <div>
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        onBlur={() => setTouched(true)}
        onChange={(e) => onChange(e.target.value)}
        className={invalid ? "border-destructive focus-visible:ring-destructive" : undefined}
      />
      {invalid && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          That doesn&apos;t look like a complete email address.
        </p>
      )}
    </div>
  );
}

/* ───────────────────────────── Chip group ───────────────────────────── */

function ChipGroup({
  options,
  selected,
  onToggle,
  disabledUnselected,
  dimWhenSuggested,
}: {
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  disabledUnselected?: boolean;
  /** When true, the (suggested) selection is shown softer than a hard choice. */
  dimWhenSuggested?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        const disabled = disabledUnselected && !isSelected;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggle(opt.value)}
            className={cn(
              "min-h-11 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? dimWhenSuggested
                  ? "border-primary/50 bg-primary/10 text-ink"
                  : "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-ink hover:border-primary/40 hover:bg-secondary/60",
              disabled
                ? "cursor-not-allowed opacity-40 hover:border-border hover:bg-card"
                : "cursor-pointer",
            )}
          >
            <span className="block leading-tight">{opt.label}</span>
            {opt.hint && (
              <span
                className={cn(
                  "mt-0.5 block text-xs font-normal",
                  isSelected && !dimWhenSuggested ? "text-primary-foreground/80" : "text-ink-soft",
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
