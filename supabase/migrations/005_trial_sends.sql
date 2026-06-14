-- Daybreak migration 005: trial_sends (pre-registration leads)
-- Records people who tried the no-login /start flow — entered an email and (maybe)
-- received a one-off email — WITHOUT subscribing. Kept deliberately separate from
-- `generated_emails` (which stays RLS-scoped to authenticated subscribers) so the
-- two never mix: trial_sends = "tried it"; generated_emails = "a subscriber's real
-- deliveries".
--
-- Lifecycle via `status`:
--   lead    — email captured (questionnaire finished), answers stored
--   sent    — a one-off email was actually delivered (set by /api/send)
--   claimed — this email later subscribed (set during account provisioning)
-- `claimed_at` gives the headline metric: which trial emails converted vs not.
--
-- The same raw `answers` shape as user_preferences.answers (migration 004) is
-- stored here, so on signup we can copy it straight into the new account's
-- preferences — no re-entry.

CREATE TABLE trial_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  focus_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_goal TEXT,
  tone VARCHAR(20),
  -- Last one-off email actually delivered (null while status = 'lead').
  subject TEXT,
  theme VARCHAR(50),
  used_fallback BOOLEAN,
  status VARCHAR(20) NOT NULL DEFAULT 'lead',
  -- Stitches the row to PostHog so DB leads and funnel events line up.
  posthog_distinct_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  claimed_at TIMESTAMP,

  CONSTRAINT trial_sends_status_check CHECK (status IN ('lead', 'sent', 'claimed')),
  CONSTRAINT trial_sends_answers_object CHECK (jsonb_typeof(answers) = 'object')
);

CREATE INDEX idx_trial_sends_email ON trial_sends(email);
CREATE INDEX idx_trial_sends_status ON trial_sends(status);
-- Fast "unconverted leads" lookups.
CREATE INDEX idx_trial_sends_unclaimed ON trial_sends(created_at) WHERE claimed_at IS NULL;

-- Keep updated rows' nothing... (no updated_at column by design — this is an
-- append/upsert lead log, not a mutable profile).

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- This table holds un-consented anonymous PII (emails + their answers). It is
-- written and read ONLY by the server via the service-role key, which bypasses
-- RLS. Enabling RLS with NO policies denies all anon/authenticated access — the
-- browser can never read or write it directly. All capture goes through our own
-- server endpoints (which validate + shape the data).
ALTER TABLE trial_sends ENABLE ROW LEVEL SECURITY;
