import type { Metadata } from "next";

import { site } from "@/lib/config";
import { PageHero } from "@/components/sections/page-hero";
import { Footer } from "@/components/sections/footer";
import { CookieSettingsTrigger } from "@/components/analytics/cookie-settings-trigger";

export const metadata: Metadata = {
  title: "Privacy & Cookies",
  description: `How ${site.name} handles your data and cookies: what we collect, why, the legal basis, and how to opt out. Plain language, no surprises.`,
  alternates: { canonical: "/privacy" },
};

// Keep this current whenever the substance of the policy changes.
const LAST_UPDATED = "19 June 2026";

export default function PrivacyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Privacy & Cookies"
        title="Your data, in plain language"
        subtitle="No dark patterns, no surprises. Here's exactly what we collect, why, and the choices you have."
      />

      <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-primary">
          <p className="lead">
            {site.name} is built to be calm and respectful, and that includes how we
            treat your data. This page explains what we collect, the cookies we
            use, the legal basis for it, and the control you have. We follow the
            EU GDPR, the ePrivacy (“cookie”) rules, the UK GDPR, and the
            California CCPA/CPRA.
          </p>
          <p>
            <em>Last updated: {LAST_UPDATED}.</em>
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>What you tell us during setup:</strong> your name, goal,
              the tone you choose, and the email address to send to. We use this
              only to write and deliver your daily email. Legal basis:
              performance of our service to you (GDPR Art. 6(1)(b)).
            </li>
            <li>
              <strong>Analytics: only with your consent.</strong> If you accept
              the cookie banner, we use privacy-friendly product analytics to see
              which pages are used and where the experience can improve. Decline
              and we don’t track you at all. Legal basis: your consent (GDPR Art.
              6(1)(a)), which you can withdraw any time.
            </li>
            <li>
              <strong>A consent record</strong>, so we remember your
              accept/decline choice and don’t ask again.
            </li>
          </ul>

          <h2>Cookies and similar technologies</h2>
          <p>
            A cookie is a small text file (or equivalent local storage) a site
            saves in your browser. We keep this to the minimum. We do{" "}
            <strong>not</strong> use advertising or marketing cookies, we do{" "}
            <strong>not</strong> track you across other websites, and we never
            sell or share your data with data brokers. Nothing non-essential is
            set until you opt in. The page works fully whether you accept or
            decline.
          </p>

          <h3>Strictly necessary (always on)</h3>
          <ul>
            <li>
              <strong>Consent cookie.</strong> Remembers whether you accepted or
              declined analytics so the banner doesn’t reappear. It contains only
              that choice, no personal data, no tracking. Exempt from consent
              under the ePrivacy rules because it’s strictly necessary to honour
              your preference. Stored in your browser; cleared when you clear site
              data.
            </li>
          </ul>

          <h3>Analytics (only after you opt in)</h3>
          <p>
            With your consent we use a{" "}
            <strong>privacy-friendly third-party analytics provider</strong> for
            product analytics. Only when you accept, it sets a first-party cookie to
            recognise your browser across pages in a visit. Here’s what that data is,
            and what it is not:
          </p>
          <ul>
            <li>
              <strong>What it sends us:</strong> pages you view, clicks and
              interactions on the site, the page that referred you, and technical
              details like browser, operating system, device type and screen size.
              Your approximate location (country/region) is derived from your IP
              address.
            </li>
            <li>
              <strong>What it does not do:</strong> we don’t store your full IP
              address for tracking, we don’t collect the content you write during
              setup, we don’t use this for advertising, profiling or automated
              decisions, and we don’t sell or rent it. It’s used purely to
              understand and improve the site in aggregate.
            </li>
            <li>
              <strong>Turn it off any time:</strong> decline on the banner, use
              the <em>Manage cookie preferences</em> button below, or clear your
              cookies. Withdrawing consent stops collection going forward.
            </li>
          </ul>

          <div className="not-prose my-8 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-medium text-ink">
              Manage your cookie choice
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Change or withdraw your consent at any time, it’s as easy as
              giving it.
            </p>
            <CookieSettingsTrigger className="mt-4 inline-flex h-11 items-center justify-center rounded-lg border border-input bg-transparent px-5 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
          </div>

          <h2>Who processes your data</h2>
          <p>
            We share data only with a small set of trusted service providers
            (“processors”) who act on our instructions, covering{" "}
            <strong>
              email delivery, website hosting, data storage, and (with your consent)
              product analytics
            </strong>
            . They may only use it to provide those services to us, never for their
            own purposes.
          </p>
          <p>
            Some of these process data outside your country (for example, in the
            United States). Where that happens, transfers are covered by
            appropriate safeguards such as the EU Standard Contractual Clauses.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your account and preference data for as long as your
            subscription is active, and delete it on request or a reasonable time
            after you stop using {site.name}. Analytics data is retained only in
            aggregate for as long as it’s useful to improve the product. The
            consent cookie lasts until you clear it or it expires.
          </p>

          <h2>Your rights and choices</h2>
          <ul>
            <li>
              <strong>Analytics:</strong> click <em>Decline</em> on the banner, or
              use <em>Manage cookie preferences</em> above to change or withdraw
              consent at any time.
            </li>
            <li>
              <strong>Email:</strong> every email includes an unsubscribe link,
              and you can stop any time.
            </li>
            <li>
              <strong>Access, correct, delete, export:</strong> under GDPR/UK GDPR
              you can ask for a copy of your data, fix it, delete it, or object to
              processing. Under CCPA/CPRA you can request access or deletion, and
              note we do not sell or share personal information.
            </li>
            <li>
              <strong>Complain:</strong> if you’re in the EU/UK you can also lodge
              a complaint with your local data protection authority.
            </li>
          </ul>

          <h2>Contact</h2>
          <p>
            Questions about your data, or want to exercise a right? Write to{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and a
            real person will reply. We respond to rights requests within the time
            the law requires (generally one month under the GDPR).
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
