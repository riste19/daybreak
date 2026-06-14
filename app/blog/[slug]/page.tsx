import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { site } from "@/lib/config";
import { getPostSlugs, getPostMeta, type PostMeta } from "@/lib/blog";
import { Footer } from "@/components/sections/footer";

type Params = { params: Promise<{ slug: string }> };

// Only the known articles are valid routes; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getPostMeta(slug);
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `${site.url}/blog/${slug}`,
      title: meta.title,
      description: meta.description,
      publishedTime: meta.date,
    },
  };
}

export default async function BlogPost({ params }: Params) {
  const { slug } = await params;
  const mod = await import(`@/content/blog/${slug}.mdx`);
  const Post = mod.default;
  const meta = mod.metadata as PostMeta;

  // Article structured data (links back to the Organization in the root layout).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.date,
    keywords: meta.keywords?.join(", "),
    mainEntityOfPage: `${site.url}/blog/${slug}`,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@id": `${site.url}/#organization` },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
        >
          <ArrowLeft className="size-4" />
          All posts
        </Link>

        <header className="mt-6">
          <time dateTime={meta.date} className="text-sm text-ink-soft">
            {formatDate(meta.date)}
          </time>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight text-ink">
            {meta.title}
          </h1>
        </header>

        <div className="prose prose-lg mt-8 max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-em:text-ink prose-hr:border-border">
          <Post />
        </div>
      </article>

      <Footer />
    </main>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
