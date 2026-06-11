-- Daybreak Database Schema
-- Initial migration: users, subscriptions, preferences, generated emails, waitlist

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120),
  auth_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  plan VARCHAR(50) NOT NULL DEFAULT 'free_trial',
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  subscription_started_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- TABLE: user_preferences
-- ============================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tone VARCHAR(20) DEFAULT 'gentle',
  send_time VARCHAR(20) DEFAULT 'dawn',
  primary_goal TEXT,
  custom_notes TEXT,
  preferred_themes JSONB DEFAULT '[]'::jsonb,
  focus_categories JSONB DEFAULT '[]'::jsonb,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- TABLE: generated_emails
-- ============================================================================
CREATE TABLE generated_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  theme VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  used_fallback BOOLEAN NOT NULL DEFAULT FALSE,
  generation_input JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_emails_user_id_sent_at ON generated_emails(user_id, sent_at DESC);
CREATE INDEX idx_generated_emails_sent_at ON generated_emails(sent_at);

-- ============================================================================
-- TABLE: waitlist
-- ============================================================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_claimed_at ON waitlist(claimed_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users: authenticated users can only read their own record
CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscriptions: users can read their own subscription
CREATE POLICY "subscriptions_select_self" ON subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "subscriptions_update_self" ON subscriptions
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  );

-- User Preferences: users can read/update their own
CREATE POLICY "user_preferences_select_self" ON user_preferences
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "user_preferences_update_self" ON user_preferences
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  );

-- Generated Emails: users can only read their own
CREATE POLICY "generated_emails_select_self" ON generated_emails
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
  );

-- Waitlist: public can insert (for form submissions), no read/delete
CREATE POLICY "waitlist_insert_anonymous" ON waitlist
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
