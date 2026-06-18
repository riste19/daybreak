"use client";

import type { ReactNode } from "react";

import { OPEN_COOKIE_SETTINGS_EVENT } from "./cookie-consent";

/**
 * Reopens the cookie preferences panel. Lives on the privacy page so consent
 * can be changed or withdrawn at any time (GDPR Art. 7(3)), not just on first
 * visit when the banner appears.
 */
export function CookieSettingsTrigger({
  className,
  children = "Manage cookie preferences",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
      }
    >
      {children}
    </button>
  );
}
