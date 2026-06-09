"use client";

import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  /** Total dots (selected categories + the closing step). */
  total: number;
  /** Zero-based index of the active dot. */
  active: number;
}

/**
 * Soft progress for the chosen categories only — never a "12 steps remaining"
 * countdown. Dots before the active one read as done; the rest are quietly waiting.
 */
export function ProgressDots({ total, active }: ProgressDotsProps) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1.5" role="presentation">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === active ? "w-5 bg-primary" : "w-1.5",
            i < active ? "bg-primary/50" : i > active ? "bg-border" : "",
          )}
        />
      ))}
    </div>
  );
}
