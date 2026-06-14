import type { Metadata } from "next";

import { site } from "@/lib/config";
import { PageHero } from "@/components/sections/page-hero";
import { Footer } from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} handles your data — what we collect, why, and how to opt out. Plain language, no surprises.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Privacy"
        title="Your data, in plain language"
        subtitle="No dark patterns, no surprises. Here's exactly what we collect and why."
      />

      <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-primary">
          <p>
            {site.name} is built to be calm and respectful — that includes how we
            treat your data. This page explains what we collect and the choices
            you have.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>What you tell us during setup</strong> — your name, goal,
              the tone you choose, and the email address to send to. We use this
              only to write and deliver your daily email.
            </li>
            <li>
              <strong>Analytics — only with your consent.</strong> If you accept
              the cookie banner, we use privacy-friendly product analytics to see
              which pages are used and where the experience can improve. Decline
              and we don't track you at all.
            </li>
            <li>
              <strong>A consent cookie</strong> — to remember your accept/decline
              choice so we don't ask again.
            </li>
          </ul>

          <h2>Who processes it</h2>
          <ul>
            <li>
              <strong>Resend</strong> — sends the emails.
            </li>
            <li>
              <strong>Supabase</strong> — stores your preferences and history.
            </li>
            <li>
              <strong>PostHog</strong> — product analytics, only after consent.
            </li>
            <li>
              <strong>Vercel</strong> — hosts the website.
            </li>
          </ul>

          <h2>Your choices</h2>
          <ul>
            <li>
              <strong>Analytics:</strong> click <em>Decline</em> on the banner, or
              clear cookies to be asked again.
            </li>
            <li>
              <strong>Email:</strong> every email includes an unsubscribe link,
              and you can stop any time.
            </li>
            <li>
              <strong>Your data:</strong> email us to access or delete it.
            </li>
          </ul>

          <h2>Contact</h2>
          <p>
            Questions about your data? Write to{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and a
            real person will reply.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
