# Daybreak

Daybreak sends each subscriber one short, AI-written email every morning. The email is
personalized to their goals, habits and tasks, written in the tone they choose, and delivered at
the local time they set.

Live at **[daybreakmail.com](https://daybreakmail.com)**.

## How it works

1. **Onboarding** (`/start`): a short questionnaire collects goals, habits, tone and send time.
   Without creating an account, a visitor can get one sample email as a trial.
2. **Signup** (`/subscribe`): creates an account and stores the subscriber's preferences.
   Sign-in is passwordless (magic link). Checkout is a mock for now; no payment provider is
   connected yet.
3. **Daily delivery**: a scheduler calls `/api/cron/send-daily` every 15 minutes. Each run emails
   only the subscribers whose local clock has passed their send time and who have not been
   emailed yet that local day, so repeated runs never send twice.
4. **Generation and sending**: the engine builds a prompt from the subscriber's preferences, calls
   the LLM, validates the output, renders the HTML email and sends it through Resend.

## Architecture

The repo holds two separately installed packages that talk only over HTTP, authenticated with a
shared-secret header.

| Part | Tech | Responsibility |
| --- | --- | --- |
| Web app (repo root) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui | Marketing site, onboarding, accounts and dashboard, MDX blog, SEO, the cron endpoint, the Supabase data layer |
| Engine (`api/`) | NestJS 11, TypeScript | Prompt construction, input moderation, LLM calls, output validation, email rendering, delivery. It has no database. |
| Data and auth | Supabase (PostgreSQL, Auth) | Subscribers, preferences, trial leads, generated emails. Migrations are in `supabase/migrations`. |
| LLM | Gemini and Anthropic APIs | Ordered provider chain with failover |
| Email | Resend, React Email | Sending from a verified domain, branded templates, unsubscribe |
| Analytics | PostHog | Page views and the onboarding funnel, behind an opt-in cookie banner |
| Hosting | Vercel (web app), Render (engine) | The engine is a long-running server, so it is hosted separately |
| Scheduler | GitHub Actions | `*/15 * * * *` workflow that triggers the daily send |

## Generation pipeline

The engine's `generation` module runs these steps for every email:

1. **Prompt construction** (`prompt/build-prompt.ts`) from goals, habits, tone and recent themes.
2. **Input moderation** (`moderation/moderate-input.ts`) on free-text answers.
3. **Provider chain** (`llm/fallback-llm-client.ts`): Gemini first, then Anthropic. A provider
   that errors or runs out of quota is skipped and the next one is tried.
4. **Output validation** (`validation/validate-output.ts`): the response must be valid JSON with a
   3 to 80 character subject, every requested section present, at most 200 words in total, and no
   HTML or code.
5. **Static fallback** (`fallback/fallback-bank.ts`): if every attempt fails, a pre-written message
   is sent, so a subscriber always receives an email.

## Run locally

Requires Node 22 and pnpm.

```bash
pnpm install            # web app
pnpm -C api install     # engine

cp .env.example .env.local   # then fill in the Supabase and engine values
# create api/.env with GEMINI_API_KEY (see api/README.md for all engine variables)

pnpm -C api start:dev   # engine on http://localhost:3002
pnpm dev                # web app on http://localhost:3000
```

Without `RESEND_API_KEY` the engine prints emails to the console instead of sending them.

## Tests and CI

```bash
pnpm test               # Vitest: web app and engine tests (the LLM is mocked)
pnpm exec tsc --noEmit  # typecheck; next build does not fail on type errors
pnpm -C api build       # engine build
```

GitHub Actions runs the typecheck, the engine build and the tests on every pull request.

## More documentation

- [`DEPLOYMENT.md`](DEPLOYMENT.md): setup checklist for the domain, email, database, LLM keys and hosting
- [`COSTS.md`](COSTS.md): running costs
- [`api/README.md`](api/README.md): engine endpoints and environment variables
- [`supabase/README.md`](supabase/README.md): database schema and migrations

## Author

Built by [Riste Semenkovski](https://github.com/riste19). Commits from the
`altaira-imbrium-tech` account are also mine; it is my second GitHub account.
