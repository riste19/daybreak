import Link from "next/link";
import { Sunrise } from "lucide-react";

import { site } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-night/40 bg-night px-6 py-10 text-cream/70">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Sunrise className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-medium text-cream">{site.name}</p>
            <p className="text-xs text-cream/55">{site.tagline}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          <Link href="/#how-it-works" className="transition-colors hover:text-cream">
            How it works
          </Link>
          <Link href="/#sample" className="transition-colors hover:text-cream">
            Sample
          </Link>
          <Link href="/subscribe" className="transition-colors hover:text-cream">
            Pricing
          </Link>
          <Link href="/about" className="transition-colors hover:text-cream">
            About
          </Link>
          <a
            href={site.social.href}
            className="transition-colors hover:text-cream"
            target="_blank"
            rel="noopener noreferrer"
          >
            {site.social.label}
          </a>
          <Link href="/contact" className="transition-colors hover:text-cream">
            Contact
          </Link>
          <Link href="/login" className="transition-colors hover:text-cream">
            Sign in
          </Link>
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-5xl text-center text-xs text-cream/40 sm:text-left">
        © {new Date().getFullYear()} {site.name}. Made for calm mornings.
      </p>
    </footer>
  );
}
