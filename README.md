# Daybreak — landing page

A calm, conversion-focused marketing landing page for **Daybreak**: a
subscription service that sends one short, AI-written email every morning,
personalized to each person's goals, habits, and tasks — in a tone they choose,
at the time they set.

This repo is **Phase 1**: the standalone landing page whose only job is to
explain the idea and **capture waitlist emails**. The product backend (auth,
onboarding, generation engine, scheduler, email delivery) comes in later phases.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config in `app/globals.css`)
- **shadcn/ui** primitives (`components/ui/*`, Radix + class-variance-authority)
- **lucide-react** icons
- Deploys free on **Vercel** (one static page + one route handler)

## Project layout

```
app/
  layout.tsx              Fonts (Fraunces + Inter), SEO / OG / Twitter metadata
  page.tsx                Composes the landing sections in order
  globals.css             Dawn design tokens + shadcn theme (Tailwind v4)
  api/waitlist/route.ts   POST handler → validates → saveSignup()
components/
  ui/                     shadcn primitives: button, input, textarea, label
  sections/               hero, problem, how-it-works, why-different,
                          sample-email, final-cta, footer
  waitlist-form.tsx       Reusable client form with success/error states
  reveal.tsx              Scroll-reveal wrapper (respects reduced motion)
lib/
  config.ts               ⭐ Product name & brand copy — rename here, once
  storage.ts              saveSignup() — swap-in point for a real DB
  validation.ts           Email normalize/validate + note sanitize
  utils.ts                cn() class merge helper
data/signups.json         Local dev waitlist store (gitignored, auto-created)
```

### Renaming the product

The product name lives in **one place**: `lib/config.ts` (`site.name`). Change
it there and it updates the title, metadata, hero, sample email, and footer.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
```

## Waitlist storage (important)

Signups are saved through a single function — `saveSignup(email, note?)` in
`lib/storage.ts`. In local development it appends to `data/signups.json`.

> ⚠️ **This JSON file works in local dev only.** On Vercel the serverless
> filesystem is read-only/ephemeral, so signups will not persist in production
> until storage is swapped for a real store. That swap is **Prompt 2** — replace
> the body of `saveSignup` (Supabase table / Google Sheet / email-capture
> provider) while keeping its signature identical. Nothing else needs to change.

### Anti-abuse already in place

- Email is validated and normalized (trimmed + lowercased) before storage.
- A **honeypot** field (`company`) silently absorbs bots — tripping it returns a
  fake success and stores nothing.
- The optional note is sanitized (control chars stripped, length-capped).

Heavier rate limiting and analytics arrive in Prompt 2.

## Deploy to Vercel (free tier)

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
3. Framework preset auto-detects **Next.js** — no settings needed. Click **Deploy**.
4. Set `NEXT_PUBLIC_SITE_URL` to `https://daybreakmail.com` (the production domain;
   `lib/config.ts` already falls back to it) so OG/Twitter share previews and the
   canonical URL are correct.

The page is a single static route plus one serverless route handler, so it stays
comfortably within the free Hobby tier.

> **Heads-up for Prompt 4+ (the scheduler):** Vercel's free tier caps cron jobs
> at once per day. The daily-email scheduler needs to run every ~15 minutes, so
> at that phase you'll either (a) stay on Vercel and send in a few fixed daily
> batches, or (b) move only the scheduler to a free always-on host (Railway /
> Render). This does **not** affect the landing page.

## Accessibility & performance notes

- Semantic landmarks (`main`, `section`, `header`, `footer`, `nav`), labelled
  form fields, visible keyboard focus rings, and `role="status"`/`role="alert"`
  on form feedback.
- All motion is gated behind `prefers-reduced-motion` (both in CSS and in the
  `Reveal` component, which renders content immediately for reduced-motion users).
- Fonts are self-hosted via `next/font` (no layout shift, no third-party request).
- No heavy client libraries; the page is mostly static server-rendered HTML.

## Marketing: what to A/B test next

- **Hero headline.** Test the current benefit-led line against an outcome-led
  variant ("Make tomorrow morning count") and a curiosity variant. The headline
  moves conversion more than anything else on the page.
- **Form friction.** Test email-only (move the optional "what are you working
  on?" field to post-signup) vs. the current two-field form. The note gives
  great use-case signal but may cost a few percent of signups.
- **CTA copy.** "Join the waitlist" vs. "Get my first morning" vs. "Reserve my
  spot." Keep the success-state promise consistent with whatever wins.
- **Sample email as the anchor.** Test placing the sample email higher (right
  after the hero) — it's the most persuasive element, so earlier exposure may
  lift conversion. Also test rotating among 2–3 sample personas.
- **Social proof / scarcity.** Once you have signups, add a live count ("1,200
  already waiting") or an early-access framing and measure lift.
