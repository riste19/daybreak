import { describe, expect, it } from "vitest";

import {
  DEFAULT_BRANDING,
  escapeHtml,
  renderDailyEmail,
} from "./render-email";

const BASE_INPUT = {
  subject: "Two hundred honest words",
  body: "Morning, Maya.\n\nYesterday you said chapter nine was fighting you — and then you showed up anyway.\n\nGo see what she does.",
  tone: "gentle" as const,
  theme: "momentum" as const,
};

describe("renderDailyEmail", () => {
  it("renders subject, paragraphs, and meta labels into the HTML", () => {
    const { html } = renderDailyEmail(BASE_INPUT);

    expect(html).toContain("Two hundred honest words");
    expect(html).toContain("Morning, Maya.");
    expect(html).toContain("Go see what she does.");
    expect(html).toContain("Tone: Gentle");
    expect(html).toContain("theme: Momentum");
    expect(html).toContain(DEFAULT_BRANDING.productName);
    expect(html).toContain(DEFAULT_BRANDING.unsubscribeUrl);
  });

  it("splits blank-line-separated body into separate <p> elements", () => {
    const { html } = renderDailyEmail(BASE_INPUT);
    const paragraphCount = (html.match(/<p style="margin:0 0 16px;/g) ?? []).length;
    expect(paragraphCount).toBe(3);
  });

  it("produces a plain-text alternative containing the full body", () => {
    const { text } = renderDailyEmail(BASE_INPUT);
    expect(text).toContain("Two hundred honest words");
    expect(text).toContain("Morning, Maya.");
    expect(text).toContain("Tone: Gentle");
    expect(text).toContain(DEFAULT_BRANDING.unsubscribeUrl);
    expect(text).not.toContain("<");
  });

  it("omits the personal-note block when no note is given", () => {
    const { html, text } = renderDailyEmail(BASE_INPUT);
    expect(html).not.toContain(DEFAULT_BRANDING.personalNoteLabel);
    expect(text).not.toContain(DEFAULT_BRANDING.personalNoteLabel);
  });

  it("renders the personal note verbatim in its own labelled block", () => {
    const { html, text } = renderDailyEmail({
      ...BASE_INPUT,
      personalNote: "Remember why you started this.",
    });
    expect(html).toContain(DEFAULT_BRANDING.personalNoteLabel);
    expect(html).toContain("Remember why you started this.");
    expect(text).toContain("Remember why you started this.");
  });

  it("escapes HTML in every interpolated field", () => {
    const { html } = renderDailyEmail({
      ...BASE_INPUT,
      subject: `<script>alert("x")</script>`,
      body: `Hello <b>you</b> & welcome.`,
      personalNote: `<img src=x onerror=alert(1)>`,
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>you</b>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp; welcome");
  });

  it("applies branding overrides (deep-merging colors)", () => {
    const { html, text } = renderDailyEmail(BASE_INPUT, {
      productName: "Sunrise Club",
      personalNoteLabel: "Your own words",
      colors: { accent: "#123456" } as never,
    });
    expect(html).toContain("Sunrise Club");
    expect(html).toContain("#123456");
    // Non-overridden colors survive the merge.
    expect(html).toContain(DEFAULT_BRANDING.colors.ink);
    expect(text).toContain("Sunrise Club");
    expect(html).not.toContain(">Daybreak<");
  });
});

describe("escapeHtml", () => {
  it("escapes the five significant characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
    );
  });
});
