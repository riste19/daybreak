-- Daybreak migration 004: persist the raw onboarding answers
-- Adds user_preferences.answers — the full, raw answer map from the questionnaire
-- ({ "<questionId>": value }, e.g. "fitness.sport": "running"). The discrete
-- columns (tone, send_time, primary_goal, custom_notes, focus_categories,
-- preferred_themes) remain the DERIVED view the engine reads; `answers` is the
-- source the advanced edit page rehydrates so the deep per-category questions can
-- be shown and re-edited without losing anything.
--
-- Existing rows default to '{}' and keep rendering off their discrete columns.

ALTER TABLE user_preferences
  ADD COLUMN answers JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Guard the top-level shape (must be a JSON object). Per-question validation
-- happens in app code against the onboarding schema.
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_answers_object
  CHECK (jsonb_typeof(answers) = 'object');
