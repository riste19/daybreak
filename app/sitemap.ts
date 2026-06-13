import type { MetadataRoute } from "next";

import { site } from "@/lib/config";

/**
 * The crawlable, indexable pages. `/start` is intentionally excluded — it's the
 * onboarding tool and carries `robots: { index: false }` (see app/start/page.tsx).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
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
  ];
}
