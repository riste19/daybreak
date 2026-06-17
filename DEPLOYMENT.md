# Daybreak — Pre-Deployment Checklist & Setup Guide (Budget Path)

> Ship Daybreak on the **~€4/mo budget stack** from [COSTS.md §3](COSTS.md): one
> small VPS runs **both** apps (Next.js site + NestJS engine) behind Caddy, a free
> system cron drives the daily send, and every other service stays on its free tier
> until you have paying users.

Architecture recap: the **Next.js site** (public, owns the DB + the send cron) talks
server-to-server to the **NestJS engine** (private, generates + renders + sends mail).
On this stack the engine listens only on `localhost` — it is never exposed publicly.

---

## 0. Pre-flight checklist

Tick all before pointing the domain at the box.

**Accounts & secrets**
- [ ] Domain `daybreakmail.com` (have it) + registrar DNS access
- [ ] Supabase project created, migrations run, keys copied
- [ ] Resend account, **domain verified** (SPF/DKIM/DMARC green)
- [ ] Gemini API key on the **paid** tier (billing enabled)
- [ ] Anthropic API key (fallback)
- [ ] `CRON_SECRET` and `ENGINE_API_KEY` generated (`openssl rand -hex 32`)
- [ ] (For real charging) Paddle account — see §6

**Config**
- [ ] All env vars set in `.env.local` (web) and `api/.env` (engine) — §9
- [ ] Domain placeholders point at `daybreakmail.com`, not `daybreak.email`

**Verified working**
- [ ] Onboarding → first email actually arrives in an inbox
- [ ] Manual cron trigger returns `{ sent: N }`
- [ ] Unsubscribe link works
- [ ] Engine rejects calls without `x-api-key`; cron rejects calls without the bearer

---

## 1. Accounts to create

| Service | Plan to start | Why |
|---|---|---|
| Supabase | Free | DB + Auth (Pro $25 once you have paying users — backups) |
| Resend | Free (100/day) | Email sending (Pro $20 past ~100 subs) |
| Google AI Studio | **Paid (billing on)** | Gemini 2.5 Flash — free tier caps 250/day + trains on your data |
| Anthropic | Pay-as-you-go | Haiku 4.5 fallback |
| Hetzner (or any VPS) | CX22 ~€4/mo | Hosts both apps |
| Paddle | — | Merchant of Record (when you wire real billing) |

---

## 2. Domain & DNS (`daybreakmail.com`)

The code defaults to `daybreak.email` — override via env (do **not** edit defaults).
At your registrar, add:

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | your VPS IPv4 | site |
| A | `www` | your VPS IPv4 | site (Caddy redirects to apex) |
| TXT / CNAME | (from Resend) | (from Resend) | SPF, DKIM, DMARC — see §3 |

DNS propagation can take up to a few hours. Caddy will auto-issue TLS once the A
record resolves.

---

## 3. Email — Resend

1. **Add domain** `daybreakmail.com` in Resend → it shows the exact DNS records
   (SPF `TXT`, three DKIM `CNAME`s, a DMARC `TXT` at `_dmarc`). Add them at your
   registrar and wait for Resend to mark the domain **Verified**.
2. **Create an API key** → this is `RESEND_API_KEY`.
3. **Set the sender**: `EMAIL_FROM="Daybreak <mornings@daybreakmail.com>"`. Until the
   domain is verified, Resend only sends from its sandbox to your own address.
4. **Supabase Auth SMTP** (so login/magic-link mail also comes from your domain) —
   in Supabase → Authentication → SMTP Settings, enable Custom SMTP:
   `smtp.resend.com` · port `465` · user `resend` · pass = your Resend API key ·
   sender `accounts@daybreakmail.com`. Then raise Authentication → Rate Limits →
   "Emails sent". (Auth mail shares your Resend quota.)

---

## 4. Database & Auth — Supabase

1. Create the project (pick an EU region for latency/data-residency).
2. **Run migrations** — SQL Editor, paste each file in `supabase/migrations/` in
   order (001 → 006), or via CLI:
   ```bash
   supabase link --project-ref YOUR_REF
   supabase db push
   ```
3. **Copy keys** (Settings → API): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
   (server-only — never `NEXT_PUBLIC`).
4. **Auth**: enable the Email provider; set Authentication → URL Configuration →
   Site URL to `https://daybreakmail.com` and add `/auth/callback` as a redirect.
5. **Verify RLS is on** for all tables (the migrations enable it — confirm in
   Table Editor). Without keys the app runs in demo mode (writes nothing).

---

## 5. LLM — Gemini (paid) + Anthropic fallback

1. Google AI Studio → create API key → **enable billing** on its Cloud project so
   you're on the paid tier (removes the 250/day cap + data-training). Set
   `GEMINI_API_KEY`. Optionally `GEMINI_API_KEYS=key1,key2` for failover.
2. Anthropic Console → create key → `ANTHROPIC_API_KEY`. Leave `GEMINI_MODEL`
   (`gemini-2.5-flash`) and `ANTHROPIC_MODEL` (`claude-haiku-4-5`) at defaults.

Cost is cents (see COSTS.md §2) — no subscription, pure usage.

---

## 6. Payments — Paddle (Merchant of Record)

> Billing is still **mocked** ([`app/subscribe/actions.ts`](app/subscribe/actions.ts)).
> You can soft-launch trial-only today (cards validate, nothing charges, trials go
> quiet on expiry). To actually charge:

1. Create a Paddle account (handles all global VAT/sales tax — see COSTS.md §4).
2. Create products/prices matching the plan `id`s in [`lib/pricing.ts`](lib/pricing.ts).
3. Replace the mock checkout with Paddle hosted checkout + a webhook that flips the
   subscription `trial → active`. (Separate task — ask when ready.)

---

## 7. Hosting — one VPS, both apps

Example: Hetzner CX22, Ubuntu 24.04. Run everything as a **non-root** user.

```bash
# Base tooling
sudo apt update && sudo apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs git
sudo corepack enable                 # provides pnpm
# Caddy (auto-TLS reverse proxy)
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt -y install caddy

# App
git clone <your-repo-url> daybreak && cd daybreak
pnpm install
pnpm build                           # builds the Next.js site
pnpm --dir api install
pnpm --dir api build                 # builds the engine → api/dist

# Add env files now (see §9): ./.env.local  and  ./api/.env

# Process manager
sudo npm i -g pm2
pm2 start "pnpm start" --name daybreak-web          # next start → :3000
pm2 start "node dist/main.js" --name daybreak-engine --cwd ./api   # → :3002
pm2 save && pm2 startup                              # restart on reboot
```

**Caddyfile** (`/etc/caddy/Caddyfile`) — exposes only the site; the engine stays on
localhost:

```
daybreakmail.com, www.daybreakmail.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

`DAYBREAK_API_URL=http://localhost:3002` keeps web→engine traffic on the box.

---

## 8. Scheduler — system crontab (free)

The send job must run **every ~15 min** (timezone-aware; see
[`send-daily/route.ts`](app/api/cron/send-daily/route.ts)). `vercel.json` only
matters on Vercel — on a VPS use crontab:

```bash
crontab -e
```
```cron
*/15 * * * * curl -fsS -m 60 -H "Authorization: Bearer YOUR_CRON_SECRET" https://daybreakmail.com/api/cron/send-daily >> /var/log/daybreak-cron.log 2>&1
```

(Or use **cron-job.org** — same URL + header — if you'd rather not own the schedule.)

---

## 9. Environment variables

**Web app** — `./.env.local`
```env
NEXT_PUBLIC_SITE_URL=https://daybreakmail.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...            # server-only, never expose
DAYBREAK_API_URL=http://localhost:3002
ENGINE_API_KEY=<same secret as the engine>
CRON_SECRET=<random; matches the crontab header>
RESEND_API_KEY=...                       # contact form / direct sends
EMAIL_FROM=Daybreak <mornings@daybreakmail.com>
NEXT_PUBLIC_POSTHOG_KEY=...              # optional analytics
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

**Engine** — `./api/.env`
```env
PORT=3002
ENGINE_API_KEY=<same secret as the web app>
GEMINI_API_KEY=...                       # paid tier
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_API_KEY=...                     # fallback
ANTHROPIC_MODEL=claude-haiku-4-5
RESEND_API_KEY=...
EMAIL_FROM=Daybreak <mornings@daybreakmail.com>
EMAIL_REPLY_TO=hello@daybreakmail.com    # optional
APP_URL=https://daybreakmail.com         # unsubscribe links
```

`CRON_SECRET` and `ENGINE_API_KEY` are **required in production** — the cron returns
500 without the former, and the engine refuses unauthenticated calls without the
latter.

---

## 10. Security hardening

- [ ] SSH: key-only auth, disable root login + passwords
- [ ] Firewall: `sudo ufw allow 22,80,443/tcp && sudo ufw enable`
- [ ] Engine bound to `localhost` only (Caddy proxies just the site) ✓ by design
- [ ] `ENGINE_API_KEY` + `CRON_SECRET` set to long random values
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local` (server), never `NEXT_PUBLIC_*`
- [ ] Supabase RLS enabled on every table
- [ ] Unattended security updates: `sudo apt -y install unattended-upgrades`
- [ ] Add a privacy policy + working unsubscribe (sensitive data — see COSTS.md note)

---

## 11. Smoke tests (before go-live)

```bash
# Engine refuses unauthenticated calls in prod:
curl -i http://localhost:3002/generate/preview -X POST -d '{}'        # → 401

# Engine accepts the key:
curl -i http://localhost:3002/generate/preview -X POST \
  -H "x-api-key: $ENGINE_API_KEY" -H "Content-Type: application/json" -d '{...}'

# Cron rejects a bad/missing secret, accepts the real one:
curl -i https://daybreakmail.com/api/cron/send-daily                  # → 401
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://daybreakmail.com/api/cron/send-daily                        # → { ok, sent, ... }
```

Then end-to-end: complete `/start` onboarding with a real address → confirm the
first email lands, looks right, and its unsubscribe link works.

---

## 12. Go-live

1. Point DNS A records at the VPS; wait for Caddy to issue TLS (`https://` loads).
2. Run the §11 smoke tests against the live domain.
3. Enable the crontab.
4. Watch `pm2 logs` and `/var/log/daybreak-cron.log` for the first few send cycles.
5. Flip Supabase to **Pro** the day you take a first payment (backups).

---

## What's still open (not blockers for a trial-only soft launch)

- **Real billing** — Paddle checkout + webhook (§6).
- **Monitoring/alerts** — add Sentry + a "cron sent N" alert (a silent cron failure
  means nobody gets email). See COSTS/notes and the earlier review.
- **Email body persistence** — sends store theme + timestamp, not the body.
