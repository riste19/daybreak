// Database storage functions (replaces the stub in lib/storage.ts)
// All functions use the Supabase client

import { supabase, createServerClient } from './client';
import type { User, UserPreferences, GeneratedEmail, Subscription, WaitlistEntry } from '@/lib/types/database';

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
 * Create a trial subscription for a user
 * (Called after first email is generated)
 */
export async function createTrialSubscription(
  userId: string,
  trialDays: number = 7
): Promise<Subscription> {
  const serverClient = createServerClient();
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await serverClient
    .from('subscriptions')
    .insert([
      {
        user_id: userId,
        status: 'trial',
        plan: 'free_trial',
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
    generation_input: Record<string, any>;
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
        generation_input: email.generation_input,
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
// SERVER-SIDE (SERVICE ROLE) — for the subscribe flow + daily cron, which run
// without a user session, so the anon/RLS helpers above don't apply here.
// ============================================================================

/** Create a subscriber (no auth: id is auto-generated, auth_id stays null). */
export async function createSubscriber(
  email: string,
  name: string | null,
): Promise<User> {
  const serverClient = createServerClient();
  const { data, error } = await serverClient
    .from('users')
    .insert([{ email, name }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create subscriber: ${error.message}`);
  return data as User;
}

/** Server-side preferences upsert (keyed by the unique user_id). */
export async function upsertUserPreferencesServer(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<void> {
  const serverClient = createServerClient();
  const { error } = await serverClient
    .from('user_preferences')
    .upsert([{ user_id: userId, ...preferences }], { onConflict: 'user_id' });
  if (error) throw new Error(`Failed to upsert preferences: ${error.message}`);
}

/**
 * Persist (or update) a subscriber and their preferences, and ensure a trial
 * subscription exists. Idempotent by email. Used by the onboarding subscribe API.
 */
export async function subscribeUser(params: {
  email: string;
  name: string | null;
  preferences: Partial<UserPreferences>;
}): Promise<User> {
  const serverClient = createServerClient();
  const existingUser = await getUserByEmail(params.email);
  const user = existingUser ?? (await createSubscriber(params.email, params.name));

  await upsertUserPreferencesServer(user.id, params.preferences);

  const { data: subs } = await serverClient
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);
  if (!subs || subs.length === 0) {
    await createTrialSubscription(user.id);
  }
  return user;
}

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
