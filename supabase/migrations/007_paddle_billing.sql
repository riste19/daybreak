-- Daybreak migration 007: Paddle billing link
-- Wires the `subscriptions` table to Paddle (the Merchant of Record). Paddle owns
-- the card, the trial, the auto-charge at trial end, and dunning; our row mirrors
-- the lifecycle so the daily cron (getActiveSubscribersForSend) keeps emailing the
-- right people. The Paddle webhook (app/api/webhooks/paddle/route.ts) is the only
-- writer of these columns.
--
-- status mapping (Paddle subscription.status -> subscriptions.status):
--   trialing            -> 'trial'   (trial_ends_at = current period end)
--   active | past_due   -> 'active'  (past_due stays active during Paddle dunning)
--   paused  | canceled  -> 'cancelled'

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS paddle_customer_id     VARCHAR(64);

-- One Paddle subscription maps to at most one row. Partial unique index so the
-- many existing NULLs (pre-Paddle / mock-checkout rows) don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paddle_subscription_id_key
  ON subscriptions (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;
