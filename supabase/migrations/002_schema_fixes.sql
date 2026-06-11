-- Daybreak Schema Fixes (migration 002)
-- Applies fixes on top of 001_initial_schema.sql
-- Safe to run on the live DB because tables are still empty.
--
-- Changes:
--   1. Resolve auth_id / RLS contradiction: users.id IS the Supabase Auth uid
--   2. Enforce one subscription per user (UNIQUE on subscriptions.user_id)
--   3. Convert subscriptions.status ENUM -> VARCHAR + CHECK (easier to extend)
--   4. Add CHECK constraints to user_preferences.tone and send_time
--   5. Make the waitlist "unclaimed" index partial

-- ============================================================================
-- 1. users.id == auth.users.id  (drop the redundant auth_id column)
-- ============================================================================
-- After this, the registration code must insert users with
--   id = <the Supabase Auth user's id>  (do NOT auto-generate it).

ALTER TABLE users DROP COLUMN IF EXISTS auth_id;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

ALTER TABLE users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- The existing users RLS policies (auth.uid() = id) are now correct as-is.

-- ============================================================================
-- 2. One subscription per user
-- ============================================================================
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- ============================================================================
-- 3. subscriptions.status: ENUM -> VARCHAR(20) + CHECK
-- ============================================================================
-- Drop the policies that depend on the column's table first is NOT needed
-- (they don't reference status). Convert the column, then drop the enum type.

ALTER TABLE subscriptions
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE subscriptions
  ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE subscriptions
  ALTER COLUMN status SET DEFAULT 'trial';

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'paused', 'past_due'));

DROP TYPE IF EXISTS subscription_status;

-- ============================================================================
-- 4. Constrain tone and send_time (consistency with status)
-- ============================================================================
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_tone_check
  CHECK (tone IN ('gentle', 'direct', 'playful', 'stoic'));

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_send_time_check
  CHECK (send_time IN ('early', 'dawn', 'mid_morning'));

-- ============================================================================
-- 5. Partial index for fast "unclaimed waitlist" lookups
-- ============================================================================
DROP INDEX IF EXISTS idx_waitlist_claimed_at;

CREATE INDEX idx_waitlist_unclaimed
  ON waitlist(created_at)
  WHERE claimed_at IS NULL;

-- ============================================================================
-- 6. Simplify RLS policies now that users.id == auth.uid()
-- ============================================================================
-- The old policies used `user_id IN (SELECT id FROM users WHERE id = auth.uid())`.
-- That subquery is now equivalent to `user_id = auth.uid()` — cleaner and faster.

DROP POLICY IF EXISTS "subscriptions_select_self" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_self" ON subscriptions;
DROP POLICY IF EXISTS "user_preferences_select_self" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_self" ON user_preferences;
DROP POLICY IF EXISTS "generated_emails_select_self" ON generated_emails;

CREATE POLICY "subscriptions_select_self" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_self" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_select_self" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_self" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_emails_select_self" ON generated_emails
  FOR SELECT USING (auth.uid() = user_id);
