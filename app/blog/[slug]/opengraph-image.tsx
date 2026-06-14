import { ImageResponse } from "next/og";

import { getPostSlugs, getPostMeta } from "@/lib/blog";
import { site } from "@/lib/config";

export const alt = `${site.name} journal`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prerender an OG card for each known article (mirrors the page's params).
export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

// Per-article share card: the post title on the brand dawn gradient.
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPostMeta(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          color: "#fdf8f1",
          background:
            "linear-gradient(135deg, #15122b 0%, #241b40 45%, #3a2a4d 75%, #f5a623 160%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "28px",
            color: "#ffd27a",
            fontSize: "30px",
            fontWeight: 600,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "9999px",
              background: "#ffd27a",
            }}
          />
          {site.name} · Journal
        </div>
        <div style={{ fontSize: "62px", fontWeight: 600, lineHeight: 1.1 }}>
          {meta.title}
        </div>
      </div>
    ),
    { ...size },
  );
}
