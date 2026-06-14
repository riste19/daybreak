import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Clock,
  CreditCard,
  LogOut,
  Mail,
  Pencil,
  Sparkles,
  Sunrise,
} from "lucide-react";

import { site } from "@/lib/config";
import { getPlan } from "@/lib/pricing";
import { getCategory } from "@/lib/onboarding/onboarding-schema";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/sections/footer";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "Manage your Daybreak subscription and morning email settings.",
  robots: { index: false, follow: false },
};

const SEND_TIME_LABELS: Record<string, string> = {
  early: "6:00am",
  dawn: "7:00am",
  mid_morning: "8:00am",
};

const STATUS_LABELS: Record<string, string> = {
  trial: "Free trial",
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  paused: "Paused",
  past_due: "Past due",
};

function categoryLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((id) => getCategory(id)?.label ?? id);
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  // Supabase not configured → a clear, non-crashing notice instead of accounts.
  if (!isSupabaseConfigured()) {
    return <NotConfigured />;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: prefs }, { data: sub }, { data: emails }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("generated_emails")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(5),
    ]);

  const metaName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const name = profile?.name ?? metaName ?? user.email ?? "there";
  const planName = sub ? (getPlan(sub.plan)?.name ?? sub.plan) : null;
  const focus = categoryLabels(prefs?.focus_categories);
  const trialEnds = formatDate(sub?.trial_ends_at ?? null);

  return (
    <main className="min-h-dvh bg-background">
      <DashboardHeader />

      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          Good morning, {name.split(/\s+/)[0]}.
        </h1>
        <p className="mt-2 text-ink-soft">
          Here&apos;s your {site.name} at a glance. Change anything anytime.
        </p>

        <div className="mt-10 grid gap-6">
          {/* Subscription */}
          <Card icon={CreditCard} title="Your plan">
            {sub ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-medium text-ink">{planName}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    <StatusBadge status={sub.status} />
                    {sub.status === "trial" && trialEnds ? (
                      <span className="ml-2">Trial ends {trialEnds}</span>
                    ) : null}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/subscribe">Manage plan</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-ink-soft">You don&apos;t have a plan yet.</p>
                <Button asChild variant="glow">
                  <Link href="/subscribe">
                    Choose a plan
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Preferences */}
          <Card icon={Sunrise} title="Your mornings">
            {prefs ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Goal">{prefs.primary_goal || "—"}</Field>
                <Field label="Tone">
                  <span className="capitalize">{prefs.tone}</span>
                </Field>
                <Field label="Delivery">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" aria-hidden />
                    {SEND_TIME_LABELS[prefs.send_time] ?? prefs.send_time}
                  </span>
                </Field>
                <Field label="Focusing on">
                  {focus.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {focus.map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-ink"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </Field>
              </dl>
            ) : (
              <p className="text-ink-soft">
                Your preferences aren&apos;t set up yet.
              </p>
            )}
            <div className="mt-5">
              <Button asChild variant="ghost" size="sm">
                <Link href="/start" transitionTypes={["nav-forward"]}>
                  <Pencil className="size-4" aria-hidden />
                  Edit my mornings
                </Link>
              </Button>
            </div>
          </Card>

          {/* Recent emails */}
          <Card icon={Mail} title="Recent mornings">
            {emails && emails.length > 0 ? (
              <ul className="divide-y divide-border">
                {emails.map((email) => (
                  <li key={email.id} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0 truncate text-ink">{email.subject}</span>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {formatDate(email.sent_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">
                Your first email is on its way — sent mornings will appear here.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  );
}

/* ───────────────────────────── Pieces ──────────────────────────────── */

function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium text-ink transition-opacity hover:opacity-70">
          {site.name}
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "trial";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-primary/10 text-primary" : "bg-secondary text-ink-soft"
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? "bg-primary" : "bg-ink-soft"}`} aria-hidden />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function NotConfigured() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium text-ink">
          Accounts aren&apos;t connected yet
        </h1>
        <p className="mx-auto mt-3 text-ink-soft">
          The dashboard needs Supabase configured. Add your keys to{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">.env.local</code>{" "}
          (see <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">supabase/README.md</code>),
          then sign-in and accounts come to life.
        </p>
        <div className="mt-7">
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
