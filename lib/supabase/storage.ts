// Database storage functions (replaces the stub in lib/storage.ts)
// All functions use the Supabase client

import { supabase, createServerClient } from './client';
import type { Json } from './types';
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
    generation_input: Record<string, Json>;
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

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: input.name ?? null, plan: input.plan },
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
    const user = await createUser(authId, email, input.name ?? null);
    const subscription = await createTrialSubscription(
      user.id,
      input.trialDays ?? 7,
      input.plan,
    );
    const preferences = await createUserPreferences(user.id, input.preferences ?? {});
    return { user, subscription, preferences };
  } catch (err) {
    // Best-effort rollback so a half-provisioned account doesn't linger.
    await admin.auth.admin.deleteUser(authId).catch(() => {});
    throw err;
  }
}
