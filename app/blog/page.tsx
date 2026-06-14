import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { site } from "@/lib/config";
import { getAllPosts } from "@/lib/blog";
import { PageHero } from "@/components/sections/page-hero";
import { Footer } from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "Blog",
  description: `Calm, practical notes on motivation, morning routines, and building habits that last — from the ${site.name} team.`,
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <main>
      <PageHero
        eyebrow="The Daybreak journal"
        title="Notes for better mornings"
        subtitle="Calm, practical writing on motivation, routines, and starting the day with intention."
      />

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <time dateTime={post.date} className="text-sm text-ink-soft">
                  {formatDate(post.date)}
                </time>
                <h2 className="mt-2 font-display text-2xl font-medium leading-snug text-ink">
                  {post.title}
                </h2>
                <p className="mt-2 leading-relaxed text-ink-soft">
                  {post.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
