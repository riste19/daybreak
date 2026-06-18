# Supabase Setup Guide

This directory contains the Daybreak database schema for Supabase (Postgres).

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "daybreak") and region
3. Set a secure database password
4. Wait for the project to initialize (~2 min)

### 2. Run the Migration

In the Supabase dashboard:

1. Navigate to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste it into the editor
5. Click **Run**
6. Confirm that all tables, indexes, and functions created successfully

Alternatively, use the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

### 3. Get Connection Details

From the Supabase dashboard (**Settings > API**), add these to your `.env.local`
at the repo root. These are the exact names the app reads (see
`lib/supabase/client.ts`):

```env
# Browser client (anon key, respects RLS) — must be NEXT_PUBLIC_*
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Server-only (service role, bypasses RLS) — NEVER expose to the browser.
# Required for account creation (provisionSubscriber / the /subscribe checkout).
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Until `SUPABASE_SERVICE_ROLE_KEY` is set, account creation runs in a graceful
**demo mode** (it validates input but writes nothing). With the keys present, the
`/subscribe` checkout creates a real Supabase Auth user plus the `users`,
`subscriptions`, and `user_preferences` rows.

### 4. Set Up Supabase Auth (Optional for Now)

If you want to use Supabase Auth for user signup/login:

1. Go to **Authentication > Providers** and enable Email
2. Configure redirect URLs (add `https://daybreakmail.com/auth/callback` for prod and `http://localhost:3000/auth/callback` for dev)
3. Update the `users.auth_id` field to link to Supabase Auth users

---

## Table Reference

### `users`
Registered accounts (linked to Supabase Auth if using)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `name` | VARCHAR(120) | First name |
| `auth_id` | UUID | Links to Supabase Auth user |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last updated |

### `subscriptions`
Tracks trial and paid subscriptions

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Links to user |
| `status` | ENUM | `trial`, `active`, or `cancelled` |
| `plan` | VARCHAR(50) | Plan type (e.g., `monthly`, `annual`) |
| `trial_ends_at` | TIMESTAMP | When free trial expires |
| `subscription_started_at` | TIMESTAMP | When paid subscription starts |

**Creating a subscription:**

```sql
INSERT INTO subscriptions (user_id, status, plan, trial_ends_at)
VALUES (uuid, 'trial', 'free_trial', now() + interval '7 days');
```

### `user_preferences`
User-customizable email settings (one per user)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Links to user (unique) |
| `tone` | VARCHAR(20) | Email tone (`gentle`, `direct`, `playful`, `stoic`) |
| `send_time` | VARCHAR(20) | Local delivery time, `HH:MM` 24h, e.g. `07:00` (migration 006) |
| `primary_goal` | TEXT | Current main goal |
| `custom_notes` | TEXT | Optional closing note |
| `preferred_themes` | JSONB | Array of `{theme, weight}` objects |
| `focus_categories` | JSONB | Array of category IDs (up to 3) |
| `timezone` | VARCHAR(50) | IANA timezone (e.g., `America/New_York`) |

**Example insert:**

```sql
INSERT INTO user_preferences (user_id, tone, send_time, preferred_themes, focus_categories)
VALUES (
  uuid,
  'gentle',
  'dawn',
  '[{"theme":"gratitude","weight":1},{"theme":"momentum","weight":0.8}]'::jsonb,
  '["fitness","meditation","work"]'::jsonb
);
```

### `generated_emails`
History of all emails sent (immutable log)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Links to user |
| `subject` | TEXT | Email subject line |
| `body` | TEXT | Email body |
| `theme` | VARCHAR(50) | Theme used for generation |
| `sent_at` | TIMESTAMP | When email was sent |
| `used_fallback` | BOOLEAN | Whether LLM failed and fallback was used |
| `generation_input` | JSONB | Full input payload (for replay/audit) |

### `waitlist`
Pre-registration signups (optional: for analytics)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `note` | TEXT | Optional signup note |
| `created_at` | TIMESTAMP | Signup time |
| `claimed_at` | TIMESTAMP | When user registered (nullable) |

---

## Data Flow

### First Email → Registration Flow

1. **User completes `/start` questionnaire** (no account yet)
2. **Backend generates email** using NestJS engine
3. **Subscription created** with `status='trial'` and `trial_ends_at = now() + 7 days`
4. **Email sent** with registration link: `/register?email=user@example.com&token=X`
5. **User clicks link** → navigates to registration page
6. **User creates account** → Supabase Auth creates `auth_user`, backend creates `users` row
7. **`user_preferences` created** from onboarding answers
8. **User lands on dashboard** and can tweak settings

### Sending Daily Email

1. **Scheduler checks** subscriptions with `status != 'cancelled'` and `trial_ends_at > now()`
2. **Fetches user_preferences** for tone, send_time, themes, categories
3. **Calls generation API** with merged preferences
4. **Stores result** in `generated_emails` table
5. **Sends email** with subject/body

### User Customizes Preferences

1. **User updates** tone, goal, themes, etc. on dashboard
2. **Frontend PUTs** `/api/preferences` with new values
3. **Backend updates** `user_preferences` row
4. **Next day's email** uses updated settings

---

## Row-Level Security (RLS)

All tables have RLS enabled. Policies:

- **users**: Can only read/update own record (authenticated)
- **subscriptions**: Can only access own subscription (authenticated)
- **user_preferences**: Can only access own preferences (authenticated)
- **generated_emails**: Can only read own email history (authenticated)
- **waitlist**: Public insert (for form submissions), no read/delete

---

## TypeScript Types

See `lib/types/database.ts` for matching TypeScript interfaces:

```ts
import { User, UserPreferences, Subscription, GeneratedEmail } from '@/lib/types/database';
```

---

## Notes

- **All timestamps are UTC** (Postgres default)
- **JSONB columns** allow flexible schema evolution without migrations
- **Triggers** automatically update `updated_at` timestamps
- **Indexes** are optimized for common queries (user lookups, recent emails)
- **Foreign keys** cascade on delete (if user is deleted, their subscription/preferences/emails are too)

---

## Troubleshooting

**"Extension uuid-ossp does not exist"**
- This is usually auto-enabled on Supabase. If not, manually enable it in the SQL Editor:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

**RLS blocking queries**
- Make sure you're authenticated (pass `Authorization: Bearer JWT_TOKEN` header)
- Or use the Supabase service role key (server-side only) to bypass RLS

**Supabase Auth users not linking**
- Make sure `users.auth_id` is set when creating a user after auth signup
- Supabase Auth users are in the `auth.users` table; your `users` table is separate

---

## Next Steps

1. Integrate Supabase client in `lib/storage.ts` (referenced in README.md)
2. Update `/api/generate` to create subscription + send email with registration link
3. Build `/register` page for account signup
4. Build dashboard with preferences editor
5. Set up email scheduler to send daily emails at user's preferred time
