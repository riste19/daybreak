-- Daybreak migration 003: customizable email layout
-- Adds the subscriber's email layout — an ordered stack of sections (the mutable
-- "email builder" preference). Shape mirrors EmailLayout in lib/email/layout.ts
-- and api/src/delivery/domain/layout.ts:
--   { version, sections: [ {kind:"chrome",role}, {kind:"text",id,text,handling,label?},
--                          {kind:"ai",id} ] }
-- The default reproduces today's fixed template exactly (one AI body), so existing
-- rows render unchanged.

ALTER TABLE user_preferences
  ADD COLUMN email_layout JSONB NOT NULL DEFAULT '{
    "version": 1,
    "sections": [
      { "kind": "chrome", "role": "header" },
      { "kind": "chrome", "role": "heading" },
      { "kind": "ai", "id": "main" },
      { "kind": "chrome", "role": "signature" },
      { "kind": "chrome", "role": "meta" },
      { "kind": "chrome", "role": "footer" }
    ]
  }'::jsonb;

-- Guard the top-level shape; per-section validation happens in app code (zod).
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_email_layout_shape
  CHECK (
    jsonb_typeof(email_layout -> 'sections') = 'array'
    AND (email_layout ->> 'version') = '1'
  );
