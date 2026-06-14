import fs from "node:fs";
import path from "node:path";

/** Frontmatter-equivalent: each content/blog/*.mdx exports a `metadata` object. */
export type PostMeta = {
  title: string;
  description: string;
  /** ISO date, e.g. "2026-06-14". */
  date: string;
  keywords?: string[];
};

export type PostSummary = PostMeta & { slug: string };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Slugs of all articles (server-only — uses fs). */
export function getPostSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/** Read one post's exported `metadata`. */
export async function getPostMeta(slug: string): Promise<PostMeta> {
  const mod = await import(`@/content/blog/${slug}.mdx`);
  return mod.metadata as PostMeta;
}

/** All posts with metadata, newest first — for the index and the sitemap. */
export async function getAllPosts(): Promise<PostSummary[]> {
  const posts = await Promise.all(
    getPostSlugs().map(async (slug) => ({ slug, ...(await getPostMeta(slug)) })),
  );
  return posts.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
