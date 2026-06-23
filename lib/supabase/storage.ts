// Database storage functions (replaces the stub in lib/storage.ts)
// All functions use the Supabase client

import { supabase, createServerClient } from './client';
import type { Json, Database } from './types';
import type {
  User,
  UserPreferences,
  GeneratedEmail,
  Subscription,
  SubscriptionStatus,
  WaitlistEntry,
  TrialSend,
  OnboardingAnswer,
} from '@/lib/types/database';
import { answersToPreferences } from '@/lib/onboarding/preferences';

// ============================================================================
// WAITLIST
// ============================================================================

/**
 * Save email to waitlist (public, no auth required)
 */
export async function saveSignup(email: string, note?: string): Promise<WaitlistEntry> {
  const { data, error } = await supabase
    .from('waitlist')
    .insert([{ email, note: note || null }])
    .select()
    .single();

  if (error) throw new Error(`Failed to save signup: ${error.message}`);
  return data;
}

/**
 * Check if email already exists in waitlist
 */
export async function getWaitlistEntry(email: string): Promise<WaitlistEntry | null> {
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', email)
    .single();

  if (error?.code === 'PGRST116') return null; // Not found
  if (error) throw new Error(`Failed to fetch waitlist entry: ${error.message}`);
  return data;
}

// ============================================================================
// USERS
// ============================================================================

/**
 * Create a new user (server-side after auth signup).
 * `authUserId` must be the id of the Supabase Auth user — it becomes users.id.
 */
export async function createUser(
  authUserId: string,
  email: string,
  name: string | null
): Promise<User> {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('users')
    .insert([{ id: authUserId, email, name }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return data;
}

/**
 * Get current user's profile (authenticated only)
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .single();

  if (error?.code === 'PGRST116') return null; // Not found
  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  return data;
}

/**
 * Get user by email (server-side only)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  return data;
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Create a trial subscription for a user (called when an account is provisioned).
 * `plan` is the chosen plan id (e.g. `free_trial`, `daily`); paid plans still
 * begin as a trial until real billing converts them to `active`.
 */
export async function createTrialSubscription(
  userId: string,
  trialDays: number = 7,
  plan: string = 'free_trial'
): Promise<Subscription> {
  const serverClient = createServerClient();
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await serverClient
    .from('subscriptions')
    .insert([
      {
        user_id: userId,
        status: 'trial',
        plan,
        trial_ends_at: trialEndsAt,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create subscription: ${error.message}`);
  return data as Subscription;
}

/**
 * Get current user's subscription
 */
export async function getSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch subscription: ${error.message}`);
  return data as Subscription;
}

/**
 * Check if subscription is active (trial or paid, not expired)
 */
export async function isSubscriptionActive(): Promise<boolean> {
  const subscription = await getSubscription();
  if (!subscription) return false;

  if (subscription.status === 'cancelled') return false;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    return new Date(subscription.trial_ends_at) > new Date();
  }
  if (subscription.status === 'active') return true;

  return false;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Create user preferences (called after account creation)
 */
export async function createUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('user_preferences')
    .insert([{ user_id: userId, ...preferences }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create preferences: ${error.message}`);
  return data as UserPreferences;
}

/**
 * Get current user's preferences
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch preferences: ${error.message}`);
  return data as UserPreferences;
}

/**
 * Update current user's preferences
 */
export async function updateUserPreferences(
  updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .select()
    .single();

  if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  return data as UserPreferences;
}

// ============================================================================
// GENERATED EMAILS
// ============================================================================

/**
 * Save a generated email to history (server-side)
 */
export async function saveGeneratedEmail(
  userId: string,
  email: {
    subject: string;
    body: string;
    theme: string;
    used_fallback: boolean;
    generation_input: Record<string, unknown>;
  }
): Promise<GeneratedEmail> {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('generated_emails')
    .insert([
      {
        user_id: userId,
        subject: email.subject,
        body: email.body,
        theme: email.theme,
        sent_at: new Date().toISOString(),
        used_fallback: email.used_fallback,
        generation_input: email.generation_input as Json,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to save generated email: ${error.message}`);
  return data as GeneratedEmail;
}

/**
 * Get current user's email history
 */
export async function getUserEmailHistory(limit: number = 30): Promise<GeneratedEmail[]> {
  const { data, error } = await supabase
    .from('generated_emails')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch email history: ${error.message}`);
  return (data || []) as GeneratedEmail[];
}

/**
 * Get a specific generated email
 */
export async function getGeneratedEmail(emailId: string): Promise<GeneratedEmail | null> {
  const { data, error } = await supabase
    .from('generated_emails')
    .select('*')
    .eq('id', emailId)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch email: ${error.message}`);
  return data as GeneratedEmail;
}

// ============================================================================
// COMPOSITE QUERIES
// ============================================================================

/**
 * Get complete user profile with preferences and subscription
 */
export async function getCompleteUserProfile() {
  const [user, preferences, subscription] = await Promise.all([
    getCurrentUser(),
    getUserPreferences(),
    getSubscription(),
  ]);

  return { user, preferences, subscription };
}

/**
 * Get user with recent email history (server-side)
 */
export async function getUserWithRecentEmails(userId: string, limit: number = 5) {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('users')
    .select(
      `
      *,
      generated_emails(*, order_by: sent_at.desc, limit: ${limit})
    `
    )
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch user with emails: ${error.message}`);
  return data;
}

// ============================================================================
// TRIAL SENDS (pre-registration leads — service-role only, bypasses RLS)
// ============================================================================

export interface TrialLeadInput {
  email: string;
  /** Raw onboarding answer snapshot (email/name stripped — see preferences.ts). */
  answers: Record<string, OnboardingAnswer>;
  focusCategories: string[];
  primaryGoal?: string | null;
  tone?: string | null;
  /** PostHog distinct id, to stitch this DB lead to the funnel events. */
  posthogDistinctId?: string | null;
}

/** Fetch a trial lead by email (service role). */
export async function getTrialLead(email: string): Promise<TrialSend | null> {
  const admin = createServerClient();
  const { data, error } = await admin
    .from('trial_sends')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch trial lead: ${error.message}`);
  return (data as TrialSend | null) ?? null;
}

/**
 * Capture (or refresh) a pre-registration lead: someone who finished the no-login
 * questionnaire but hasn't subscribed. Upserts by email and never downgrades a row
 * that has already converted ('claimed') or been delivered to ('sent').
 */
export async function recordTrialLead(input: TrialLeadInput): Promise<void> {
  const admin = createServerClient();
  const email = input.email.trim().toLowerCase();

  const existing = await getTrialLead(email);
  if (existing?.status === 'claimed') return; // already a subscriber — leave it

  const { error } = await admin.from('trial_sends').upsert(
    {
      email,
      answers: input.answers,
      focus_categories: input.focusCategories,
      primary_goal: input.primaryGoal ?? null,
      tone: input.tone ?? null,
      posthog_distinct_id: input.posthogDistinctId ?? null,
      status: existing?.status === 'sent' ? 'sent' : 'lead',
    },
    { onConflict: 'email' },
  );

  if (error) throw new Error(`Failed to record trial lead: ${error.message}`);
}

/**
 * Mark that a one-off email was actually delivered to a trial email. Upserts so a
 * send with no prior lead row still lands; preserves a 'claimed' status.
 */
export async function recordTrialSend(input: {
  email: string;
  subject: string;
  theme: string;
  usedFallback: boolean;
}): Promise<void> {
  const admin = createServerClient();
  const email = input.email.trim().toLowerCase();
  const existing = await getTrialLead(email);

  const { error } = await admin.from('trial_sends').upsert(
    {
      email,
      subject: input.subject,
      theme: input.theme,
      used_fallback: input.usedFallback,
      sent_at: new Date().toISOString(),
      status: existing?.status === 'claimed' ? 'claimed' : 'sent',
    },
    { onConflict: 'email' },
  );

  if (error) throw new Error(`Failed to record trial send: ${error.message}`);
}

/** Mark a trial lead as converted — called when that email subscribes. No-op if absent. */
export async function claimTrialLead(email: string): Promise<void> {
  const admin = createServerClient();
  const { error } = await admin
    .from('trial_sends')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('email', email.trim().toLowerCase());

  if (error) throw new Error(`Failed to claim trial lead: ${error.message}`);
}

// ============================================================================
// ACCOUNT PROVISIONING
// ============================================================================

/** Editable preferences captured at signup (all optional; the DB fills defaults). */
export type ProvisionPreferences = Partial<
  Pick<
    UserPreferences,
    | 'tone'
    | 'send_time'
    | 'primary_goal'
    | 'custom_notes'
    | 'focus_categories'
    | 'preferred_themes'
    | 'answers'
    | 'timezone'
  >
>;

export interface ProvisionInput {
  email: string;
  name?: string | null;
  /** Chosen plan id (becomes subscriptions.plan). */
  plan: string;
  /** Trial length in days. */
  trialDays?: number;
  preferences?: ProvisionPreferences;
}

export interface ProvisionResult {
  user: User;
  subscription: Subscription;
  preferences: UserPreferences;
  /** True when an existing account was reactivated rather than newly created. */
  reactivated: boolean;
}

/** Thrown when an account already exists for the email — callers map this to a friendly message. */
export class AccountExistsError extends Error {
  constructor(public readonly email: string) {
    super(`An account already exists for ${email}.`);
    this.name = 'AccountExistsError';
  }
}

/**
 * Create a full subscriber account end to end: a Supabase Auth user, then the
 * `users`, `subscriptions`, and `user_preferences` rows (all server-side via the
 * service role). If any row insert fails, the just-created auth user is removed
 * so a half-provisioned account doesn't linger (FK cascades clear the rest).
 *
 * Auth is passwordless: the user is created already-confirmed and signs in later
 * via magic link. Requires the service-role env — guard with isSupabaseAdminConfigured().
 */
export async function provisionSubscriber(input: ProvisionInput): Promise<ProvisionResult> {
  const admin = createServerClient();
  const email = input.email.trim().toLowerCase();

  // Pre-fill from a prior trial: if this email tried /start before subscribing,
  // reuse the answers they already gave (no re-entry) and seed their preferences.
  const { preferences: leadPreferences, name: leadName } =
    await preferencesFromTrialLead(email);
  const name = input.name ?? leadName ?? null;
  const preferences = input.preferences ?? leadPreferences ?? {};

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, plan: input.plan },
  });

  if (authError || !created?.user) {
    const message = authError?.message ?? 'unknown error';
    // Existing account → reactivate (e.g. a cancelled / lapsed subscriber
    // re-subscribing) instead of erroring.
    if (/already (been )?regist|already exist|exists/i.test(message)) {
      return reactivateExistingSubscriber(email, input.plan, input.trialDays ?? 3);
    }
    throw new Error(`Could not create auth user: ${message}`);
  }

  const authId = created.user.id;
  try {
    const user = await createUser(authId, email, name);
    const subscription = await createTrialSubscription(
      user.id,
      input.trialDays ?? 3,
      input.plan,
    );
    const prefs = await createUserPreferences(user.id, preferences);
    // Mark the lead converted (best-effort — never fails the signup).
    await claimTrialLead(email).catch(() => {});
    return { user, subscription, preferences: prefs, reactivated: false };
  } catch (err) {
    // Best-effort rollback so a half-provisioned account doesn't linger.
    await admin.auth.admin.deleteUser(authId).catch(() => {});
    throw err;
  }
}

/**
 * Reactivate an existing subscriber re-subscribing with the same email (after
 * cancelling or letting the trial lapse). The auth user is never re-created and
 * existing preferences are kept (the dashboard edits them) — only the subscription
 * is re-enabled and the lead re-claimed.
 */
async function reactivateExistingSubscriber(
  email: string,
  plan: string,
  trialDays: number,
): Promise<ProvisionResult> {
  const existing = await getUserByEmail(email);
  if (!existing) {
    // Auth user exists but no public `users` row — a rare half-provisioned state
    // we can't safely resolve here. Surface the friendly "already exists" message.
    throw new AccountExistsError(email);
  }

  const subscription = await reactivateSubscription(existing.id, trialDays, plan);

  const admin = createServerClient();
  const { data: prefRow } = await admin
    .from('user_preferences')
    .select('*')
    .eq('user_id', existing.id)
    .maybeSingle();
  const preferences =
    (prefRow as UserPreferences | null) ??
    (await createUserPreferences(existing.id, {}));

  await claimTrialLead(email).catch(() => {});
  return { user: existing, subscription, preferences, reactivated: true };
}

/**
 * Re-enable a returning subscriber WITHOUT handing out another free trial. The
 * trial clock is fixed at first signup and never reset here, so a cancel →
 * re-subscribe loop can't farm endless free trials:
 *   • still inside the ORIGINAL trial window → resume the trial (same end date);
 *   • trial already elapsed (or no prior row → genuine first time) → go straight to
 *     'active', i.e. paid immediately (the card was collected at checkout).
 * Upserts by the unique user_id. Service-role.
 */
export async function reactivateSubscription(
  userId: string,
  trialDays: number = 3,
  plan: string = 'free_trial',
): Promise<Subscription> {
  const admin = createServerClient();
  const now = new Date();

  const { data: existing } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let payload: Database['public']['Tables']['subscriptions']['Insert'];
  if (!existing) {
    // No prior subscription — a genuine first trial.
    payload = {
      user_id: userId,
      status: 'trial',
      plan,
      trial_started_at: now.toISOString(),
      trial_ends_at: new Date(
        now.getTime() + trialDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      subscription_ends_at: null,
    };
  } else if (existing.trial_ends_at && new Date(existing.trial_ends_at) > now) {
    // Still within the original trial window → resume it (don't extend/reset).
    payload = {
      user_id: userId,
      status: 'trial',
      plan,
      subscription_ends_at: null,
    };
  } else {
    // Trial already used → re-subscribe is paid immediately, no new free time.
    payload = {
      user_id: userId,
      status: 'active',
      plan,
      subscription_started_at: now.toISOString(),
      subscription_ends_at: null,
    };
  }

  const { data, error } = await admin
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(`Failed to reactivate subscription: ${error.message}`);
  return data as Subscription;
}

/**
 * Look up a trial lead and derive signup preferences + display name from the
 * answers they already gave. Best-effort: any failure (incl. no lead) yields
 * empty values so provisioning proceeds normally.
 */
async function preferencesFromTrialLead(
  email: string,
): Promise<{ preferences: ProvisionPreferences | null; name: string | null }> {
  let lead: TrialSend | null = null;
  try {
    lead = await getTrialLead(email);
  } catch {
    return { preferences: null, name: null };
  }
  if (!lead) return { preferences: null, name: null };

  const derived = answersToPreferences({
    selectedCategories: lead.focus_categories ?? [],
    values: lead.answers ?? {},
  });

  return {
    preferences: {
      tone: derived.tone,
      send_time: derived.send_time,
      timezone: derived.timezone,
      primary_goal: derived.primary_goal,
      custom_notes: derived.custom_notes,
      focus_categories: derived.focus_categories,
      preferred_themes: derived.preferred_themes,
      answers: derived.answers,
    },
    name: derived.name,
  };
}

// ============================================================================
// DAILY SEND QUERIES (service role) — read helpers for the cron + unsubscribe.
// Subscribers are created via provisionSubscriber (Supabase Auth, the canonical
// model), so there is deliberately no no-login "createSubscriber" write path.
// ============================================================================

/** A subscriber due for a daily send: their user row + preferences. */
export type ActiveSubscriber = { user: User; preferences: UserPreferences };

/** Active (trial-not-expired or active) subscribers with preferences. */
export async function getActiveSubscribersForSend(): Promise<ActiveSubscriber[]> {
  const serverClient = createServerClient();
  const nowIso = new Date().toISOString();

  const { data: subs, error: subErr } = await serverClient
    .from('subscriptions')
    .select('user_id, status, trial_ends_at')
    .in('status', ['trial', 'active']);
  if (subErr) throw new Error(`Failed to load subscriptions: ${subErr.message}`);

  const userIds = (subs ?? [])
    .filter(
      (s) => s.status === 'active' || !s.trial_ends_at || s.trial_ends_at > nowIso,
    )
    .map((s) => s.user_id as string);
  if (userIds.length === 0) return [];

  const [usersRes, prefsRes] = await Promise.all([
    serverClient.from('users').select('*').in('id', userIds),
    serverClient.from('user_preferences').select('*').in('user_id', userIds),
  ]);
  if (usersRes.error) throw new Error(`Failed to load users: ${usersRes.error.message}`);
  if (prefsRes.error) throw new Error(`Failed to load preferences: ${prefsRes.error.message}`);

  const prefByUser = new Map(
    (prefsRes.data ?? []).map((p) => [p.user_id as string, p as UserPreferences]),
  );
  return (usersRes.data ?? [])
    .map((u) => ({ user: u as User, preferences: prefByUser.get(u.id as string) }))
    .filter((s): s is ActiveSubscriber => Boolean(s.preferences));
}

/** Recent themes for a user (newest first) — to keep daily variety. */
export async function getRecentThemes(userId: string, limit = 7): Promise<string[]> {
  const serverClient = createServerClient();
  const { data, error } = await serverClient
    .from('generated_emails')
    .select('theme')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load recent themes: ${error.message}`);
  return (data ?? []).map((r) => r.theme as string);
}

/** Idempotency: has this user already been sent since `sinceIso` (e.g. midnight)? */
export async function wasEmailSentSince(
  userId: string,
  sinceIso: string,
): Promise<boolean> {
  const serverClient = createServerClient();
  const { data, error } = await serverClient
    .from('generated_emails')
    .select('id')
    .eq('user_id', userId)
    .gte('sent_at', sinceIso)
    .limit(1);
  if (error) throw new Error(`Failed to check send history: ${error.message}`);
  return (data ?? []).length > 0;
}

/** Unsubscribe: cancel a subscriber's subscription by email. */
export async function cancelSubscriptionByEmail(email: string): Promise<boolean> {
  const serverClient = createServerClient();
  const user = await getUserByEmail(email);
  if (!user) return false;
  const { error } = await serverClient
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id);
  if (error) throw new Error(`Failed to cancel subscription: ${error.message}`);
  return true;
}

// ============================================================================
// ADMIN OVERVIEW (service role) — read-only DB snapshot for the owner-gated
// /admin dashboard. Bypasses RLS so it sees every row; never reachable by a
// non-owner (the route gates on lib/admin.ts:isOwnerEmail before calling this).
// ============================================================================

/** One subscriber row joined across the three account tables for the table view. */
export interface AdminSubscriberRow {
  user: User;
  subscription: Subscription | null;
  preferences: UserPreferences | null;
}

/** A recent daily send, with the recipient's email resolved for display. */
export interface AdminRecentEmail extends GeneratedEmail {
  email: string | null;
}

/** Everything the /admin overview renders in a single fetch. */
export interface AdminOverview {
  stats: {
    users: number;
    activeSubs: number;
    trialSubs: number;
    cancelledSubs: number;
    trialLeads: number;
    emailsToday: number;
    emailsTotal: number;
  };
  /** Most-recent accounts first (capped — this is a snapshot, not a full export). */
  subscribers: AdminSubscriberRow[];
  /** Most-recent no-login /start leads first (capped). */
  trialLeads: TrialSend[];
  /** Most-recent daily sends first (capped). */
  recentEmails: AdminRecentEmail[];
}

const ADMIN_ROW_CAP = 200;
const ADMIN_FEED_CAP = 25;

/** UTC midnight today, as an ISO string — the cut-off for the "emails today" stat. */
function startOfUtcDayIso(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * A read-only snapshot of the data layer for the owner dashboard: headline
 * counts plus capped, newest-first slices of each table. Counts use `head`
 * queries (no rows pulled); the tables are capped so a growing DB never balloons
 * the page. Service-role — call only behind the owner gate.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const serverClient = createServerClient();
  const todayIso = startOfUtcDayIso();

  const [
    usersRes,
    subsRes,
    prefsRes,
    leadsRes,
    emailsRes,
    usersCount,
    leadsCount,
    emailsTotal,
    emailsToday,
  ] = await Promise.all([
    serverClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(ADMIN_ROW_CAP),
    serverClient.from('subscriptions').select('*'),
    serverClient.from('user_preferences').select('*'),
    serverClient
      .from('trial_sends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(ADMIN_ROW_CAP),
    serverClient
      .from('generated_emails')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(ADMIN_FEED_CAP),
    serverClient.from('users').select('*', { count: 'exact', head: true }),
    serverClient.from('trial_sends').select('*', { count: 'exact', head: true }),
    serverClient.from('generated_emails').select('*', { count: 'exact', head: true }),
    serverClient
      .from('generated_emails')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', todayIso),
  ]);

  const firstError =
    usersRes.error ?? subsRes.error ?? prefsRes.error ?? leadsRes.error ?? emailsRes.error;
  if (firstError) throw new Error(`Failed to load admin overview: ${firstError.message}`);

  const subs = (subsRes.data ?? []) as Subscription[];
  const subByUser = new Map(subs.map((s) => [s.user_id, s]));
  const prefByUser = new Map(
    ((prefsRes.data ?? []) as UserPreferences[]).map((p) => [p.user_id, p]),
  );
  const users = (usersRes.data ?? []) as User[];
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const subscribers: AdminSubscriberRow[] = users.map((user) => ({
    user,
    subscription: subByUser.get(user.id) ?? null,
    preferences: prefByUser.get(user.id) ?? null,
  }));

  const recentEmails: AdminRecentEmail[] = ((emailsRes.data ?? []) as GeneratedEmail[]).map(
    (e) => ({ ...e, email: emailById.get(e.user_id) ?? null }),
  );

  const countByStatus = (status: SubscriptionStatus) =>
    subs.filter((s) => s.status === status).length;

  return {
    stats: {
      users: usersCount.count ?? users.length,
      activeSubs: countByStatus('active'),
      trialSubs: countByStatus('trial'),
      cancelledSubs: countByStatus('cancelled'),
      trialLeads: leadsCount.count ?? (leadsRes.data ?? []).length,
      emailsToday: emailsToday.count ?? 0,
      emailsTotal: emailsTotal.count ?? 0,
    },
    subscribers,
    trialLeads: (leadsRes.data ?? []) as TrialSend[],
    recentEmails,
  };
}

/** Everything the /admin/users/[id] detail page renders for one account. */
export interface AdminUserDetail {
  user: User;
  subscription: Subscription | null;
  preferences: UserPreferences | null;
  /** This account's full send history, newest first (capped). */
  emails: GeneratedEmail[];
  /** The no-login /start lead with the same email, if one exists. */
  lead: TrialSend | null;
}

const ADMIN_USER_EMAIL_CAP = 100;

/**
 * The full record for a single account, joined across every table that
 * references it: subscription, preferences, send history, and any matching
 * trial lead (by email). Returns null when the id doesn't exist. Service-role —
 * call only behind the owner gate.
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const serverClient = createServerClient();

  const { data: userRow, error: userErr } = await serverClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (userErr) throw new Error(`Failed to load user: ${userErr.message}`);
  if (!userRow) return null;
  const user = userRow as User;

  const [subRes, prefRes, emailsRes, leadRes] = await Promise.all([
    serverClient.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    serverClient.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
    serverClient
      .from('generated_emails')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(ADMIN_USER_EMAIL_CAP),
    serverClient
      .from('trial_sends')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const firstError = subRes.error ?? prefRes.error ?? emailsRes.error ?? leadRes.error;
  if (firstError) throw new Error(`Failed to load user detail: ${firstError.message}`);

  return {
    user,
    subscription: (subRes.data as Subscription | null) ?? null,
    preferences: (prefRes.data as UserPreferences | null) ?? null,
    emails: (emailsRes.data ?? []) as GeneratedEmail[],
    lead: ((leadRes.data ?? [])[0] as TrialSend | undefined) ?? null,
  };
}
