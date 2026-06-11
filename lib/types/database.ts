// Database schema types (auto-aligned with Supabase)

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string | null;
  auth_id: string | null;
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
  send_time: 'early' | 'dawn' | 'mid_morning';
  primary_goal: string | null;
  custom_notes: string | null;
  preferred_themes: Array<{ theme: string; weight: number }>;
  focus_categories: string[];
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedEmail {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  theme: string;
  sent_at: string;
  used_fallback: boolean;
  generation_input: Record<string, any> | null;
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
