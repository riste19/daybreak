import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { site } from "@/lib/config";
import { getSessionUser } from "@/lib/supabase/server";
import { Footer } from "@/components/sections/footer";
import { PageHero } from "@/components/sections/page-hero";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to manage your ${site.name} subscription and morning email settings.`,
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? Go straight to the dashboard.
  if (await getSessionUser()) {
    redirect("/dashboard");
  }

  return (
    <main>
      <PageHero
        eyebrow="Welcome back"
        title="Sign in to Daybreak"
        subtitle="Enter your email and we'll send you a secure sign-in link — no password to remember."
      />

      <section className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <LoginForm />
        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{" "}
          <a
            href="/subscribe"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            See the plans
          </a>{" "}
          to start your mornings.
        </p>
      </section>

      <Footer />
    </main>
  );
}
