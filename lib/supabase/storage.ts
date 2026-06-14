// Database storage functions (replaces the stub in lib/storage.ts)
// All functions use the Supabase client

import { supabase, createServerClient } from './client';
import type { Json } from './types';
import type {
  User,
  UserPreferences,
  GeneratedEmail,
  Subscription,
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
    if (/already (been )?regist|already exist|exists/i.test(message)) {
      throw new AccountExistsError(email);
    }
    throw new Error(`Could not create auth user: ${message}`);
  }

  const authId = created.user.id;
  try {
    const user = await createUser(authId, email, name);
    const subscription = await createTrialSubscription(
      user.id,
      input.trialDays ?? 7,
      input.plan,
    );
    const prefs = await createUserPreferences(user.id, preferences);
    // Mark the lead converted (best-effort — never fails the signup).
    await claimTrialLead(email).catch(() => {});
    return { user, subscription, preferences: prefs };
  } catch (err) {
    // Best-effort rollback so a half-provisioned account doesn't linger.
    await admin.auth.admin.deleteUser(authId).catch(() => {});
    throw err;
  }
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
