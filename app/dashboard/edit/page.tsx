import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { site } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { preferencesToAnswers } from "@/lib/onboarding/preferences";
import { EditPreferencesForm } from "@/components/dashboard/edit-preferences-form";

export const metadata: Metadata = {
  title: "Edit your mornings",
  description: "Fine-tune the goal, tone, timing, and focus of your Daybreak emails.",
  robots: { index: false, follow: false },
};

export default async function EditPreferencesPage() {
  // Accounts need Supabase — fall back to the dashboard's own notice.
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const metaName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const name = profile?.name ?? metaName ?? null;

  // Rehydrate the full answer set (deep questions included) from the stored row.
  const { selectedCategories, values } = preferencesToAnswers(prefs ?? {}, name);

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-lg font-medium text-ink transition-opacity hover:opacity-70"
          >
            {site.name}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          Edit your mornings
        </h1>
        <p className="mt-2 text-ink-soft">
          Reshape what {site.name} sends you. Everything&apos;s here on one page,
          adjust as much or as little as you like, then save.
        </p>

        <EditPreferencesForm
          email={user.email ?? ""}
          initialSelected={selectedCategories}
          initialValues={values}
        />
      </div>
    </main>
  );
}
