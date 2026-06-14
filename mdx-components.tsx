import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Global MDX component map — REQUIRED by @next/mdx in the App Router (without it,
 * MDX silently won't render). Base typography is handled by Tailwind's `prose`
 * classes on the article wrapper; this only adds brand polish: internal links use
 * next/link, external links open safely in a new tab.
 */
const components: MDXComponents = {
  a: ({ href, children, ...props }) => {
    const url = String(href ?? "");
    const className = "text-primary underline underline-offset-4 hover:opacity-80";
    if (url.startsWith("/")) {
      return (
        <Link href={url} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
