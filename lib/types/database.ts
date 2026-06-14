// Database schema types (auto-aligned with Supabase)

import type { EmailLayout } from '@/lib/email/layout';

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled';

export interface User {
  id: string; // same value as the Supabase Auth user id
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  tone: 'gentle' | 'direct' | 'playful' | 'stoic';
  /** Local delivery time-of-day, "HH:MM" (24h). */
  send_time: string;
  primary_goal: string | null;
  custom_notes: string | null;
  preferred_themes: Array<{ theme: string; weight: number }>;
  focus_categories: string[];
  /** The subscriber's customizable email layout (see migration 003). */
  email_layout: EmailLayout;
  /** Raw onboarding answer map, keyed by question id (see migration 004). */
  answers: Record<string, OnboardingAnswer>;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/** A single stored onboarding answer (mirrors AnswerValue in resolveAnswers). */
export type OnboardingAnswer = string | string[] | number;

/**
 * A pre-registration "trial send" lead (see migration 005): someone who tried the
 * no-login /start flow without subscribing. Service-role access only — never read
 * by the browser.
 */
export interface TrialSend {
  id: string;
  email: string;
  answers: Record<string, OnboardingAnswer>;
  focus_categories: string[];
  primary_goal: string | null;
  tone: string | null;
  /** Last one-off email actually delivered (null while status = 'lead'). */
  subject: string | null;
  theme: string | null;
  used_fallback: boolean | null;
  status: 'lead' | 'sent' | 'claimed';
  posthog_distinct_id: string | null;
  created_at: string;
  sent_at: string | null;
  claimed_at: string | null;
}

export interface GeneratedEmail {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  theme: string;
  sent_at: string;
  used_fallback: boolean;
  generation_input: Record<string, unknown> | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
  claimed_at: string | null;
}

// Composite types for common queries
export interface UserWithPreferences extends User {
  preferences: UserPreferences | null;
  subscription: Subscription | null;
}

export interface UserWithEmails extends User {
  generated_emails: GeneratedEmail[];
  preferences: UserPreferences | null;
}
