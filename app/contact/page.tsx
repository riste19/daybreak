import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";

import { site } from "@/lib/config";
import { Footer } from "@/components/sections/footer";
import { PageHero } from "@/components/sections/page-hero";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions, feedback, or just want to say hello? Get in touch with the ${site.name} team.`,
};

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="We'd love to hear from you"
        title="Get in touch"
        subtitle="Questions, feedback, or a story about your mornings — send a note and a real person will write back."
      />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <aside className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">
              Reach us directly
            </h2>
            <p className="mt-3 text-ink-soft">
              Prefer your own inbox? We read everything that lands here.
            </p>
          </div>

          <ul className="space-y-5">
            <ContactMethod
              icon={<Mail className="size-5" aria-hidden />}
              label="Email"
              value={site.contactEmail}
              href={`mailto:${site.contactEmail}`}
            />
            <ContactMethod
              icon={<MessageCircle className="size-5" aria-hidden />}
              label="Social"
              value={site.social.label}
              href={site.social.href}
              external
            />
          </ul>

          <p className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-ink-soft">
            We're a small team and aim to reply within a couple of mornings.
          </p>
        </aside>

        <ContactForm />
      </section>

      <Footer />
    </main>
  );
}

function ContactMethod({
  icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink-soft">{label}</span>
        <a
          href={href}
          className="block truncate font-medium text-ink underline-offset-4 transition-colors hover:text-primary hover:underline"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {value}
        </a>
      </span>
    </li>
  );
}
