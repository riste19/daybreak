import Link from "next/link";
import { Mail, Sunrise } from "lucide-react";

import { site } from "@/lib/config";

/** Footer navigation, grouped into tidy columns. Routes are all real pages. */
const linkGroups = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Sample", href: "/#sample" },
      { label: "Pricing", href: "/subscribe" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Get started", href: "/start" },
      { label: "Sign in", href: "/login" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-night text-cream/70">
      {/* A soft "first light" edge — a thin gold line warming the top seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[44rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/20">
                <Sunrise className="size-4" aria-hidden />
              </span>
              <span className="font-display text-lg font-medium text-cream">
                {site.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-cream/55">
              {site.tagline}
            </p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-5 inline-flex items-center gap-2 text-sm text-cream/60 transition-colors hover:text-gold"
            >
              <Mail className="size-4" aria-hidden />
              {site.contactEmail}
            </a>
          </div>

          {/* Link columns */}
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-cream/40">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-cream/65 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-3 border-t border-white/10 pt-6 text-xs text-cream/40 sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}. Made for calm mornings.
          </p>
          <p>One calm email a day. No app, no feed.</p>
        </div>
      </div>
    </footer>
  );
}
