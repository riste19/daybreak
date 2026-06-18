import type { MetadataRoute } from "next";

import { site } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}: ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f1", // cream — daylight page base
    theme_color: "#15122b", // night — the dawn hero
    icons: [{ src: "/icon", sizes: "any", type: "image/png" }],
  };
}
