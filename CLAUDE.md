# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Two independent packages (read this first)

This repo is **not** a monorepo workspace — it's two separately-installed packages:

- **Root** — Next.js 16 (App Router, **Turbopack**, React 19, Tailwind v4): the marketing
  site, onboarding (`/start`), the Supabase data layer, PostHog analytics, SEO, and the daily
  cron. Uses **pnpm**.
- **`api/`** — a standalone **NestJS 11** "generation engine" with its own `package.json`,
  `pnpm-lock.yaml`, and `tsconfig.json`. It generates the email copy, renders the branded HTML
  template, and sends it (Resend, or console in dev). **It has no database.**

They talk **only over HTTP**: `app/api/{generate,send}/route.ts` and the daily cron POST to
`${DAYBREAK_API_URL}` → the engine's `/generate/preview` and `/delivery/send`. **The frontend
never imports from `api/`.** Cross-boundary contracts are kept as **hand-synced mirrored copies**
on each side — e.g. `lib/onboarding/buildGenerationInput.ts` ↔ `api/src/generation/domain/types.ts`,
and `lib/email/layout.ts` ↔ `api/src/delivery/domain/layout.ts`. Tone/Theme vocabularies are
lowercase on both sides on purpose (no casing-translation layer). Keep mirrors in sync by hand.

## The daily delivery loop (the actual product)

`/start` onboarding → `app/api/subscribe` persists the subscriber + preferences + a trial in
Supabase (**server-side service-role; no login/auth**) → a **Vercel Cron** (`vercel.json` →
`app/api/cron/send-daily`, guarded by `CRON_SECRET`) runs daily, builds a `SendDailyInput` from
each active subscriber's stored prefs (+ recent themes), POSTs to the engine's `/delivery/send`,
and records `generated_emails` for idempotency. `app/unsubscribe` cancels a subscription.
`lib/supabase/storage.ts` holds both the anon/RLS helpers and the new **service-role** query
helpers used by the cron/subscribe routes.

## LLM provider chain (`api/src/generation/llm/`)

`GenerationService` depends only on the `LlmClient` interface. In production that's an ordered
`FallbackLlmClient`: multi-key Gemini (`GEMINI_API_KEYS`, comma-separated) → Anthropic Haiku
(`ANTHROPIC_API_KEY`), failing over on error. `DeliveryService` composes generation + template +
the email client.

## Deployment

Frontend → **Vercel** (project `daybreak-c5i4`); engine → **Render** (a long-running server;
Vercel serverless can't host it). They're wired by the Vercel env var `DAYBREAK_API_URL`. Real
inbox delivery requires a Resend-verified domain + `EMAIL_FROM`; until then the engine only truly
delivers to the Resend account owner (others → `provider: "console"`). Canonicals/sitemap/OG read
`site.url` from `NEXT_PUBLIC_SITE_URL` (`lib/config.ts`). `api/README.md` documents the engine's
endpoints and env.

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
- CI (`.github/workflows/ci.yml`) runs tsc + `api` build + tests on every PR; keep them green.
