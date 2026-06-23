# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Two independent packages (read this first)

This repo is **not** a monorepo workspace — it's two separately-installed packages:

- **Root** — Next.js 16 (App Router, **Turbopack**, React 19, Tailwind v4): the marketing
  site, onboarding (`/start`), accounts (magic-link `/login` + `/dashboard`) and `/subscribe`
  checkout, the Supabase data layer, PostHog analytics, SEO, and the daily cron. Uses **pnpm**.
- **`api/`** — a standalone **NestJS 11** "generation engine" with its own `package.json`,
  `pnpm-lock.yaml`, and `tsconfig.json`. It generates the email copy, renders the branded HTML
  template, and sends it (Resend, or console in dev). **It has no database.**

They talk **only over HTTP**: `app/api/{generate,send}/route.ts` and the daily cron POST to
`${DAYBREAK_API_URL}` → the engine's `/generate/preview` and `/delivery/send`, authenticated
server-to-server with an `x-api-key` shared secret (`lib/engine.ts:engineHeaders()` ↔ the
engine's global `EngineAuthGuard` / `ENGINE_API_KEY` — see Gotchas). **The frontend
never imports from `api/`.** Cross-boundary contracts are kept as **hand-synced mirrored copies**
on each side — e.g. `lib/onboarding/buildGenerationInput.ts` ↔ `api/src/generation/domain/types.ts`,
and `lib/email/layout.ts` ↔ `api/src/delivery/domain/layout.ts`. Tone/Theme vocabularies are
lowercase on both sides on purpose (no casing-translation layer). Keep mirrors in sync by hand.

## The two funnels + the daily delivery loop (the actual product)

There are **two entry funnels**, both writing via **Server Actions** (there is no
`app/api/subscribe` route — it was removed):

1. **No-login trial** — `/start` onboarding → `app/start/actions.ts` (`captureTrialLead`) →
   `lib/supabase/storage.ts:recordTrialLead()` writes a lead to the **`trial_sends`** table
   (migration 005). A one-off sample email is sent via `app/api/send/route.ts`, which then marks
   the lead `sent` (`recordTrialSendFromResponse`). No account, no auth.
2. **Paid signup** — `/subscribe` → `app/subscribe/actions.ts` (`createSubscriberAccount`) →
   `lib/supabase/storage.ts:provisionSubscriber()` creates a Supabase **Auth** user +
   `users`/`subscriptions`/`user_preferences`. Prefs can be pre-filled from a prior trial lead via
   `preferencesFromTrialLead()`. **Checkout is mock** (no Stripe yet).

**Auth is now hybrid** (not "no auth"): passwordless **magic-link** login —
`app/login/actions.ts` (`sendMagicLink` → `supabase.auth.signInWithOtp`) +
`app/auth/callback/route.ts` (`exchangeCodeForSession`); session read server-side via
`lib/supabase/server.ts` (`getSessionUser`, `createSupabaseServerClient`). `/dashboard` and
`/dashboard/edit` (prefs editor) are auth-gated (redirect to `/login`). **Note:** `/login` is
**sign-in only** (`shouldCreateUser: false`) — accounts are created **only** via `/subscribe`,
so an email with no account silently gets no link.

**Owner-gated debug:** `/start`'s final review step is the dev `DebugReview` (editable system
prompt, request JSON, raw engine response) for **owners only** — `app/start/page.tsx` reads the
session and passes an `isOwner` boolean (`lib/admin.ts:isOwnerEmail`, a **server-only** allowlist;
the client never sees the emails). Everyone else gets the clean `components/onboarding/review-send.tsx`,
which still sends the trial email.

**The daily cron** — `app/api/cron/send-daily/route.ts` (a **GET**, guarded by
`Authorization: Bearer <CRON_SECRET>`) builds a `SendDailyInput` from each active subscriber's
stored prefs (+ recent themes) via `getActiveSubscribersForSend()`/`buildSendInputFromPrefs()`,
POSTs to the engine's `/delivery/send`, and records `generated_emails`. It is **pull-based and
written to run frequently (≈ every 15 min)**: each run emails only subscribers whose **local
clock has passed their `send_time` today** (`timezone`-aware via `localClock()`) and who haven't
been emailed yet this **local** day (`wasEmailSentSince()` idempotency — so extra calls never
double-send). **Per-user `send_time`/`timezone` IS honored** (default `07:00`, `MAX_PER_RUN=100`).
The real scheduler is a **GitHub Actions** workflow (`.github/workflows/cron-send-daily.yml`,
`*/15 * * * *`) because Vercel Hobby caps crons at once/day; `vercel.json`'s `0 6 * * *` is a
harmless daily backstop. `app/unsubscribe` cancels a subscription.
`lib/supabase/storage.ts` holds the anon/RLS helpers plus the **service-role** helpers used by the
cron/actions (`recordTrialLead`, `provisionSubscriber`, `preferencesFromTrialLead`,
`getActiveSubscribersForSend`).

## LLM provider chain (`api/src/generation/llm/`)

`GenerationService` depends only on the `LlmClient` interface. In production that's an ordered
`FallbackLlmClient`: multi-key Gemini (`GEMINI_API_KEYS`, comma-separated) → Anthropic Haiku
(`ANTHROPIC_API_KEY`), failing over on error. `DeliveryService` composes generation + template +
the email client.

## Deployment

**Live in production at [daybreakmail.com](https://daybreakmail.com).** Frontend → **Vercel**
(project `daybreak-c5i4`); engine → **Render** (a long-running server; Vercel serverless can't host
it). They're wired by the Vercel env var `DAYBREAK_API_URL`. The Resend domain (`daybreakmail.com`)
is **verified** and `EMAIL_FROM` is set to it, so the engine delivers real mail to **any** recipient
(the old sandbox limitation — `onboarding@resend.dev` only reaching the Resend account owner, others
→ `provider: "console"` — no longer applies in prod; it still does for a local engine using the
sandbox sender). Canonicals/sitemap/OG read `site.url` from `NEXT_PUBLIC_SITE_URL` (`lib/config.ts`).
`api/README.md` documents the engine's endpoints and env.

## Commands

Root (run from repo root):
- `pnpm dev` / `pnpm build` / `pnpm start` / `pnpm lint`
- `pnpm test` (Vitest) · single test: `pnpm exec vitest run <file>` or `pnpm exec vitest run -t "<name>"`
- **`pnpm exec tsc --noEmit` — always run this.** `next.config.ts` sets
  `typescript.ignoreBuildErrors`, so `next build` does **not** fail on type errors; tsc is the
  only gate that catches them.

Engine (`api/`):
- `pnpm -C api start:dev` (watch server on `:3002` — needed for `/start` to work locally),
  `pnpm -C api build`, `pnpm -C api test` (the LLM is mocked, so no API key is needed for tests;
  the server itself needs `GEMINI_API_KEY` in `api/.env`).

## Gotchas (non-obvious, will bite you)

- **Two installs:** `pnpm install` at root **and** `pnpm -C api install`. Root Vitest also globs
  `api/**/*.test.ts`, so `pnpm test` at root needs api deps installed.
- `tsconfig.json` **excludes `api/`** (its NestJS decorators need a different config); `.vercelignore`
  excludes top-level `/api` from the Vercel build; new dependencies with install scripts must be
  approved in `pnpm-workspace.yaml` (`allowBuilds`) or the build fails (`ERR_PNPM_IGNORED_BUILDS`).
- **Modified Next + Turbopack:** MDX `remark`/`rehype` plugins must be passed as **strings** in
  `next.config.ts`; a root `mdx-components.tsx` is **required** for the `content/blog` MDX hub.
- The Supabase generated types (`lib/supabase/types.ts`) are hand-maintained and have drifted from
  the SQL migrations before — verify a column exists in `supabase/migrations/` before trusting the type.
- **Per-user `send_time` works only while the GitHub Actions cron runs.** The route filters by
  each subscriber's local `send_time`/`timezone` (migration 006), so the schedule must hit it
  **frequently** (`*/15`). That cadence is `.github/workflows/cron-send-daily.yml`, **not**
  `vercel.json` (Hobby = once/day). Two scheduled-workflow caveats: it fires **only from `main`**
  and **auto-disables after ~60 days of repo inactivity** — if sends silently stop, check the
  Actions tab first. Needs repo secrets `CRON_SECRET` (must equal Vercel's) + `CRON_ENDPOINT_URL`.
- **`ENGINE_API_KEY` must match on both sides — or be unset on both.** In production the engine's
  `EngineAuthGuard` refuses every request with `401 "Engine is not configured for authenticated
  access"` when it's unset, and `401 "Invalid or missing x-api-key"` when it differs from what the
  frontend sends (`lib/engine.ts`). Set the same value on Render (engine) **and** Vercel (frontend),
  or unset on both (dev). Setting one side only is a silent prod outage.
- **Trial-length mismatch:** `lib/pricing.ts` free tier says "7 personalized mornings" but
  `app/subscribe/actions.ts` sets `TRIAL_DAYS = 3`. Known inconsistency.
- **Checkout is mock**, not Stripe (`app/subscribe/actions.ts` validates card format only;
  `4000000000000002` forces a decline; real auto-charge is a `TODO(billing)`). `lib/pricing.ts` is
  the single source of truth for plans/prices.
- CI (`.github/workflows/ci.yml`) runs tsc + `api` build + tests on every PR; keep them green.
