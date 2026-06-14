import type { MetadataRoute } from "next";

import { site } from "@/lib/config";
import { getAllPosts } from "@/lib/blog";

/**
 * The crawlable, indexable pages. `/start` is intentionally excluded — it's the
 * onboarding tool and carries `robots: { index: false }` (see app/start/page.tsx).
 * Blog articles are appended from content/blog (see lib/blog.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const posts = await getAllPosts();

  return [
    { url: site.url, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${site.url}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${site.url}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
