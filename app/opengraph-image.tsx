import { ImageResponse } from "next/og";

import { site } from "@/lib/config";

// Social share card (Open Graph + Twitter). 1200×630 is the standard size.
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand dawn palette mirrored from app/globals.css. ImageResponse renders via
// satori — only flexbox + a subset of CSS, so every multi-child box sets display.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          textAlign: "center",
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
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "#ffd27a",
            }}
          />
          <div
            style={{
              fontSize: "42px",
              fontWeight: 600,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#ffd27a",
            }}
          >
            {site.name}
          </div>
        </div>
        <div
          style={{
            fontSize: "66px",
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: "920px",
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
