import { describe, expect, it } from "vitest";

import { DEFAULT_BRANDING, escapeHtml, renderDailyEmail } from "./render-email";
import type { EmailLayout } from "../domain/layout";

const BASE_INPUT = {
  subject: "Two hundred honest words",
  sections: {
    main: "Morning, Maya.\n\nYesterday you said chapter nine was fighting you — and then you showed up anyway.\n\nGo see what she does.",
  },
  tone: "gentle" as const,
  theme: "momentum" as const,
};

describe("renderDailyEmail — default layout", () => {
  it("renders subject, AI paragraphs, and meta labels into the HTML", () => {
    const { html } = renderDailyEmail(BASE_INPUT);

    expect(html).toContain("Two hundred honest words");
    expect(html).toContain("Morning, Maya.");
    expect(html).toContain("Go see what she does.");
    expect(html).toContain("Tone: Gentle");
    expect(html).toContain("theme: Momentum");
    expect(html).toContain(DEFAULT_BRANDING.productName);
    expect(html).toContain(DEFAULT_BRANDING.unsubscribeUrl);
  });

  it("splits the AI slot's blank-line-separated body into separate <p> elements", () => {
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

  it("has no verbatim text block when the layout has none", () => {
    const { html } = renderDailyEmail(BASE_INPUT);
    expect(html).not.toContain("border-left:3px solid");
  });

  it("renders the upgrade nudge with the subscribe link in HTML and text", () => {
    const { html, text } = renderDailyEmail(BASE_INPUT);
    expect(DEFAULT_BRANDING.upgrade).not.toBeNull();
    const upgrade = DEFAULT_BRANDING.upgrade!;
    expect(html).toContain(upgrade.url);
    expect(html).toContain(upgrade.label);
    expect(text).toContain(upgrade.url);
  });

  it("omits the upgrade nudge when branding sets upgrade to null", () => {
    const { html, text } = renderDailyEmail(BASE_INPUT, { upgrade: null });
    const upgradeUrl = DEFAULT_BRANDING.upgrade!.url;
    expect(html).not.toContain(upgradeUrl);
    expect(text).not.toContain(upgradeUrl);
  });
});

describe("renderDailyEmail — verbatim and feed text", () => {
  const withText = (handling: "verbatim" | "feed"): EmailLayout => ({
    version: 1,
    sections: [
      { kind: "chrome", role: "header" },
      { kind: "chrome", role: "heading" },
      { kind: "ai", id: "main" },
      { kind: "text", id: "t1", text: "Remember why you started this.", handling },
      { kind: "chrome", role: "footer" },
    ],
  });

  it("renders a verbatim block verbatim", () => {
    const { html, text } = renderDailyEmail({ ...BASE_INPUT, layout: withText("verbatim") });
    expect(html).toContain("Remember why you started this.");
    expect(text).toContain("Remember why you started this.");
  });

  it("does NOT render a feed block (the model consumed it)", () => {
    const { html, text } = renderDailyEmail({ ...BASE_INPUT, layout: withText("feed") });
    expect(html).not.toContain("Remember why you started this.");
    expect(text).not.toContain("Remember why you started this.");
  });

  it("renders an optional label above a verbatim block", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "chrome", role: "heading" },
        { kind: "ai", id: "main" },
        { kind: "text", id: "t1", text: "Drink water.", handling: "verbatim", label: "Daily rule" },
      ],
    };
    const { html } = renderDailyEmail({ ...BASE_INPUT, layout });
    expect(html).toContain("Daily rule");
    expect(html).toContain("Drink water.");
  });
});

describe("renderDailyEmail — multiple AI slots", () => {
  it("interleaves AI slots and verbatim text in layout order", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "chrome", role: "header" },
        { kind: "chrome", role: "heading" },
        { kind: "ai", id: "a1" },
        { kind: "text", id: "t1", text: "PINNED MIDDLE TEXT", handling: "verbatim" },
        { kind: "ai", id: "a2" },
        { kind: "chrome", role: "footer" },
      ],
    };
    const { html } = renderDailyEmail({
      ...BASE_INPUT,
      sections: { a1: "First slot content.", a2: "Second slot content." },
      layout,
    });

    const iFirst = html.indexOf("First slot content.");
    const iPinned = html.indexOf("PINNED MIDDLE TEXT");
    const iSecond = html.indexOf("Second slot content.");
    expect(iFirst).toBeGreaterThan(-1);
    expect(iPinned).toBeGreaterThan(iFirst);
    expect(iSecond).toBeGreaterThan(iPinned);
  });

  it("skips an AI slot with no generated content", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "chrome", role: "heading" },
        { kind: "ai", id: "a1" },
        { kind: "ai", id: "a2" },
      ],
    };
    const { html } = renderDailyEmail({
      ...BASE_INPUT,
      sections: { a1: "Only the first is filled." },
      layout,
    });
    expect(html).toContain("Only the first is filled.");
  });
});

describe("renderDailyEmail — escaping and branding", () => {
  it("escapes HTML in every interpolated field", () => {
    const layout: EmailLayout = {
      version: 1,
      sections: [
        { kind: "chrome", role: "heading" },
        { kind: "ai", id: "main" },
        { kind: "text", id: "t1", text: `<img src=x onerror=alert(1)>`, handling: "verbatim" },
      ],
    };
    const { html } = renderDailyEmail({
      ...BASE_INPUT,
      subject: `<script>alert("x")</script>`,
      sections: { main: `Hello <b>you</b> & welcome.` },
      layout,
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
