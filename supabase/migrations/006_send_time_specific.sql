-- Daybreak migration 006: specific send time + timezone
-- Replaces the three coarse send_time buckets (early/dawn/mid_morning) with a
-- precise local time-of-day stored as "HH:MM" (24-hour), paired with the existing
-- `timezone` column (IANA, e.g. 'Europe/Skopje'). send_time + timezone are
-- delivery metadata only — the generation engine never reads them.

-- Drop the old default + enum-style CHECK before reshaping the values.
ALTER TABLE user_preferences ALTER COLUMN send_time DROP DEFAULT;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_send_time_check;

-- Migrate any existing bucket values to a concrete local time.
UPDATE user_preferences SET send_time = CASE send_time
  WHEN 'early'       THEN '06:00'
  WHEN 'dawn'        THEN '07:00'
  WHEN 'mid_morning' THEN '08:00'
  ELSE send_time
END
WHERE send_time IN ('early', 'dawn', 'mid_morning');

ALTER TABLE user_preferences ALTER COLUMN send_time SET DEFAULT '07:00';

-- Enforce a 24-hour "HH:MM" string.
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_send_time_check
  CHECK (send_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- timezone already exists (VARCHAR(50) DEFAULT 'UTC' from migration 001); no change
-- needed. IANA validity is enforced in app code.
