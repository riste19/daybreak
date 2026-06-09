"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { categories } from "@/lib/onboarding/onboarding-schema";
import { iconMap } from "./icon-map";

interface CategoryGridProps {
  selected: string[];
  onToggle: (id: string) => void;
}

/** The intro grid of life-area cards. Tap to select/deselect — pick as few as one. */
export function CategoryGrid({ selected, onToggle }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 ">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon];
        const isSelected = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(cat.id)}
            className={cn(
              "group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? "border-primary bg-secondary shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50",
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
              )}
            >
              {Icon ? <Icon className="size-5" aria-hidden /> : null}
            </span>

            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="font-display text-base font-medium text-ink">
                  {cat.label}
                </span>
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-ink-soft">
                {cat.description}
              </span>
            </span>

            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-transparent",
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
