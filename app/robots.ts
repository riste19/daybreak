import type { MetadataRoute } from "next";

import { site } from "@/lib/config";

/**
 * Allow everything except the proxy API routes (no SEO value). `/start` is left
 * crawlable on purpose so its `noindex` meta tag is actually seen and honored.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
