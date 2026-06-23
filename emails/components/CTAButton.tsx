import { Button } from "@react-email/components";
import * as React from "react";

import { theme } from "../theme";

/**
 * The branded call-to-action button. `primary` is the accent-filled pill used
 * for the main action; `secondary` is a calmer outlined variant for lower-stakes
 * links (e.g. "Manage" next to a primary "Confirm"). Renders an email-safe
 * inline-block anchor under the hood.
 */
export interface CTAButtonProps {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

export function CTAButton({ label, href, variant = "primary" }: CTAButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-block",
    fontFamily: theme.font.body,
    fontSize: theme.fontSize.body,
    fontWeight: 600,
    lineHeight: "20px",
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: theme.radius.button,
    textAlign: "center",
  };

  const skin: React.CSSProperties =
    variant === "primary"
      ? { backgroundColor: theme.color.accent, color: theme.color.onAccent }
      : {
          backgroundColor: theme.color.card,
          color: theme.color.accent,
          border: `1px solid ${theme.color.accent}`,
        };

  return (
    <Button href={href} style={{ ...base, ...skin }}>
      {label}
    </Button>
  );
}
