import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Mail, Sparkles, Sunrise, ListChecks } from "lucide-react";

import { site } from "@/lib/config";
import { getPlan } from "@/lib/pricing";
import { getCategory } from "@/lib/onboarding/onboarding-schema";
import { formatSendTime } from "@/lib/onboarding/preferences";
import { isOwnerEmail } from "@/lib/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/client";
import { getSessionUser } from "@/lib/supabase/server";
import { getAdminUserDetail } from "@/lib/supabase/storage";
import type { OnboardingAnswer } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Admin · account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  paused: "Paused",
  past_due: "Past due",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  sent: "Sent",
  claimed: "Claimed",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function answerToText(value: OnboardingAnswer): string {
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default async function AdminUserPage({ params }: Params) {
  if (!isSupabaseAdminConfigured()) notFound();

  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!isOwnerEmail(sessionUser.email)) notFound();

  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user, subscription, preferences, emails, lead } = detail;
  const planName = subscription
    ? getPlan(subscription.plan)?.name ?? subscription.plan
    : null;
  const focus = (preferences?.focus_categories ?? [])
    .map((cid) => getCategory(cid)?.label ?? cid);
  const themes = preferences?.preferred_themes ?? [];
  const answers = Object.entries(preferences?.answers ?? {});

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to {site.name} admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          {user.email}
        </h1>
        <p className="mt-2 text-ink-soft">
          {user.name ? `${user.name} · ` : ""}Joined {formatDateTime(user.created_at)}
          <span className="ml-2 select-all font-mono text-xs text-ink-soft/70">{user.id}</span>
        </p>

        <div className="mt-10 grid gap-6">
          {/* Subscription */}
          <Card icon={CreditCard} title="Subscription">
            {subscription ? (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl font-medium text-ink">{planName}</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Trial started">{formatDateTime(subscription.trial_started_at)}</Field>
                  <Field label="Trial ends">{formatDateTime(subscription.trial_ends_at)}</Field>
                  <Field label="Subscription started">
                    {formatDateTime(subscription.subscription_started_at)}
                  </Field>
                  <Field label="Subscription ends">
                    {formatDateTime(subscription.subscription_ends_at)}
                  </Field>
                </dl>
              </>
            ) : (
              <p className="text-ink-soft">No subscription row.</p>
            )}
          </Card>

          {/* Preferences */}
          <Card icon={Sunrise} title="Preferences">
            {preferences ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Tone">
                  <span className="capitalize">{preferences.tone}</span>
                </Field>
                <Field label="Delivery">
                  {formatSendTime(preferences.send_time)}
                  <span className="text-ink-soft">
                    {" "}
                    · {(preferences.timezone || "UTC").replaceAll("_", " ")}
                  </span>
                </Field>
                <Field label="Primary goal" full>
                  {preferences.primary_goal || "—"}
                </Field>
                {preferences.custom_notes ? (
                  <Field label="Custom notes" full>
                    {preferences.custom_notes}
                  </Field>
                ) : null}
                <Field label="Focus areas" full>
                  {focus.length ? <Chips items={focus} /> : "—"}
                </Field>
                {themes.length ? (
                  <Field label="Preferred themes" full>
                    <Chips items={themes.map((t) => `${t.theme} (${t.weight})`)} />
                  </Field>
                ) : null}
              </dl>
            ) : (
              <p className="text-ink-soft">No preferences row.</p>
            )}
          </Card>

          {/* Onboarding answers */}
          {answers.length ? (
            <Card icon={ListChecks} title="Onboarding answers">
              <dl className="grid gap-3 sm:grid-cols-2">
                {answers.map(([key, value]) => (
                  <Field key={key} label={key}>
                    {answerToText(value) || "—"}
                  </Field>
                ))}
              </dl>
              {preferences?.email_layout ? (
                <details className="mt-5">
                  <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
                    Email layout (raw)
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary p-3 text-xs text-ink">
                    {JSON.stringify(preferences.email_layout, null, 2)}
                  </pre>
                </details>
              ) : null}
            </Card>
          ) : null}

          {/* Matching trial lead */}
          {lead ? (
            <Card icon={Sparkles} title="Trial lead">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-ink">
                    {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </Field>
                <Field label="Tone">
                  <span className="capitalize">{lead.tone ?? "—"}</span>
                </Field>
                <Field label="Last theme">{lead.theme ?? "—"}</Field>
                <Field label="Created">{formatDateTime(lead.created_at)}</Field>
                <Field label="Sent">{formatDateTime(lead.sent_at)}</Field>
                <Field label="Claimed">{formatDateTime(lead.claimed_at)}</Field>
              </dl>
            </Card>
          ) : null}

          {/* Send history */}
          <Card icon={Mail} title={`Send history (${emails.length})`}>
            {emails.length ? (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-ink-soft">
                      <th className="px-2 py-2 font-medium">Subject</th>
                      <th className="px-2 py-2 font-medium">Theme</th>
                      <th className="px-2 py-2 font-medium">Fallback</th>
                      <th className="px-2 py-2 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((email) => (
                      <tr key={email.id} className="border-t border-border">
                        <td className="max-w-xs truncate px-2 py-2.5 text-ink">{email.subject}</td>
                        <td className="px-2 py-2.5">{email.theme}</td>
                        <td className="px-2 py-2.5">
                          {email.used_fallback ? (
                            <span className="text-xs font-medium text-destructive">fallback</span>
                          ) : (
                            <span className="text-xs text-ink-soft">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-ink-soft">
                          {formatDateTime(email.sent_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-ink-soft">No emails sent yet.</p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────────── Pieces ──────────────────────────────── */

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

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-ink"
        >
          {item}
        </span>
      ))}
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
      <span
        className={`size-1.5 rounded-full ${active ? "bg-primary" : "bg-ink-soft"}`}
        aria-hidden
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
