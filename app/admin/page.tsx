import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Database, Mail, Users, UserPlus, Sparkles } from "lucide-react";

import { site } from "@/lib/config";
import { getPlan } from "@/lib/pricing";
import { formatSendTime } from "@/lib/onboarding/preferences";
import { isOwnerEmail } from "@/lib/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/client";
import { getSessionUser } from "@/lib/supabase/server";
import {
  getAdminOverview,
  type AdminOverview,
  type AdminSubscriberRow,
} from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin",
  description: "Owner-only data overview.",
  robots: { index: false, follow: false },
};

// Admin reads service-role data and must never be cached or statically rendered.
export const dynamic = "force-dynamic";

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

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminPage() {
  // Service-role data needs the service-role key, not just the public anon key.
  if (!isSupabaseAdminConfigured()) {
    return <NotConfigured />;
  }

  // Gate on the server-only owner allowlist. Sign-in required (→ /login); a
  // signed-in non-owner gets a 404 so the route's existence isn't revealed.
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email)) notFound();

  const overview = await getAdminOverview();

  return (
    <main className="min-h-dvh bg-background">
      <AdminHeader email={user.email ?? null} />

      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          Admin
        </h1>
        <p className="mt-2 text-ink-soft">
          A read-only snapshot of the {site.name} data layer. Owner-only.
        </p>

        <Stats stats={overview.stats} />

        <Subscribers rows={overview.subscribers} />

        <TrialLeads leads={overview.trialLeads} />

        <RecentEmails emails={overview.recentEmails} />
      </div>
    </main>
  );
}

/* ───────────────────────────── Stats ──────────────────────────────── */

function Stats({ stats }: { stats: AdminOverview["stats"] }) {
  const cards = [
    { icon: Users, label: "Accounts", value: stats.users },
    {
      icon: UserPlus,
      label: "Subscriptions",
      value: stats.activeSubs + stats.trialSubs,
      hint: `${stats.activeSubs} active · ${stats.trialSubs} trial · ${stats.cancelledSubs} cancelled`,
    },
    { icon: Sparkles, label: "Trial leads", value: stats.trialLeads, hint: "no-login /start" },
    {
      icon: Mail,
      label: "Emails sent",
      value: stats.emailsTotal,
      hint: `${stats.emailsToday} today (UTC)`,
    },
  ];
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, hint }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-ink-soft">
            <Icon className="size-4 text-primary" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          </div>
          <p className="mt-2 font-display text-3xl font-medium text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Subscribers ───────────────────────────── */

function Subscribers({ rows }: { rows: AdminSubscriberRow[] }) {
  return (
    <Section
      icon={Users}
      title="Accounts"
      count={rows.length}
      empty="No accounts yet."
      hasRows={rows.length > 0}
    >
      <Table head={["Email", "Plan", "Status", "Delivery", "Joined"]}>
        {rows.map(({ user, subscription, preferences }) => {
          const planName = subscription
            ? getPlan(subscription.plan)?.name ?? subscription.plan
            : "—";
          return (
            <tr key={user.id} className="border-t border-border">
              <Td>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-medium text-ink underline-offset-2 hover:text-primary hover:underline"
                >
                  {user.email}
                </Link>
                {user.name ? (
                  <span className="block text-xs text-ink-soft">{user.name}</span>
                ) : null}
              </Td>
              <Td>{planName}</Td>
              <Td>
                {subscription ? <StatusBadge status={subscription.status} /> : "—"}
              </Td>
              <Td>
                {preferences ? (
                  <span className="whitespace-nowrap">
                    {formatSendTime(preferences.send_time)}
                    <span className="text-ink-soft">
                      {" "}
                      · {(preferences.timezone || "UTC").replaceAll("_", " ")}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap text-ink-soft">{formatDate(user.created_at)}</Td>
            </tr>
          );
        })}
      </Table>
    </Section>
  );
}

/* ─────────────────────────── Trial leads ───────────────────────────── */

function TrialLeads({ leads }: { leads: AdminOverview["trialLeads"] }) {
  return (
    <Section
      icon={Sparkles}
      title="Trial leads"
      count={leads.length}
      empty="No trial leads yet."
      hasRows={leads.length > 0}
    >
      <Table head={["Email", "Status", "Tone", "Last theme", "Created"]}>
        {leads.map((lead) => (
          <tr key={lead.id} className="border-t border-border">
            <Td className="font-medium text-ink">{lead.email}</Td>
            <Td>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-ink">
                {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            </Td>
            <Td className="capitalize">{lead.tone ?? "—"}</Td>
            <Td>{lead.theme ?? "—"}</Td>
            <Td className="whitespace-nowrap text-ink-soft">{formatDate(lead.created_at)}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

/* ───────────────────────── Recent emails ───────────────────────────── */

function RecentEmails({ emails }: { emails: AdminOverview["recentEmails"] }) {
  return (
    <Section
      icon={Mail}
      title="Recent sends"
      count={emails.length}
      empty="No emails sent yet."
      hasRows={emails.length > 0}
    >
      <Table head={["To", "Subject", "Theme", "Fallback", "Sent"]}>
        {emails.map((email) => (
          <tr key={email.id} className="border-t border-border">
            <Td className="text-ink">{email.email ?? "—"}</Td>
            <Td className="max-w-xs truncate text-ink">{email.subject}</Td>
            <Td>{email.theme}</Td>
            <Td>
              {email.used_fallback ? (
                <span className="text-xs font-medium text-destructive">fallback</span>
              ) : (
                <span className="text-xs text-ink-soft">—</span>
              )}
            </Td>
            <Td className="whitespace-nowrap text-ink-soft">{formatDate(email.sent_at)}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

/* ───────────────────────────── Pieces ──────────────────────────────── */

function AdminHeader({ email }: { email: string | null }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Database className="size-4 text-primary" aria-hidden />
          <Link
            href="/"
            className="font-display text-lg font-medium text-ink transition-opacity hover:opacity-70"
          >
            {site.name} admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {email ? <span className="hidden text-sm text-ink-soft sm:inline">{email}</span> : null}
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">My dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  empty,
  hasRows,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  count: number;
  empty: string;
  hasRows: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-ink-soft">
          {count}
        </span>
      </div>
      {hasRows ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          {children}
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-card p-6 text-ink-soft shadow-sm">
          {empty}
        </p>
      )}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-ink-soft">
          {head.map((h) => (
            <th key={h} className="px-4 py-3 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
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

function NotConfigured() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Database className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium text-ink">
          Admin needs the service-role key
        </h1>
        <p className="mx-auto mt-3 text-ink-soft">
          The overview reads every row via the service role. Set{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          in your environment, then reload.
        </p>
      </div>
    </main>
  );
}
