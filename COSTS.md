# Daybreak — Cost, Pricing & Unit Economics

> What the product costs to run, how to take payment as a **North Macedonia–based
> seller**, and how profit scales with subscribers. The headline: infra is ~free,
> the payment processor is the only real cost of goods, North Macedonia's tax
> regime is unusually kind to a small digital business — and **CAC, not the stack
> or tax, decides whether this is profitable.**

All SaaS list prices and tax figures below are estimates from public sources and
**drift over time.** The reasoning and unit economics are robust to small changes.
Figures are in EUR; most vendors bill USD, and tax thresholds are set in Macedonian
denars (MKD ≈ **61.5 to €1**). Sources are listed at the bottom.

> ⚠️ **Not tax or legal advice.** The tax treatment below is a planning model, not
> a filing. Confirm everything with a North Macedonia accountant (сметководител) —
> especially entity structure, how Merchant-of-Record payouts are recognised as
> revenue, and the e-Faktura e-invoicing rollout (full production ~Q2 2026).
>
> **All "profit" numbers are *before* marketing/CAC and before paying yourself.**

---

## 1. What the code tells us about cost

- **One LLM call per email.** [`gemini.client.ts`](api/src/generation/llm/gemini.client.ts) —
  `gemini-2.5-flash`, `thinkingBudget: 0`, `maxOutputTokens: 1200`, body capped at
  ~200 words.
- **The prompt is tiny.** [`build-prompt.ts`](api/src/generation/prompt/build-prompt.ts) —
  system instruction + a small user-data block. ~600–900 input tokens, ~300–400
  output tokens per email.
- **Claude Haiku 4.5 is wired as a fallback** ([`env.schema.ts`](api/src/config/env.schema.ts))
  — fails over when Gemini errors or runs out of quota.
- **Payment is 100% mocked** ([`actions.ts`](app/subscribe/actions.ts)) — test
  cards, no processor, explicit `TODO(billing)`. Plan `id`s already map to
  `subscriptions.plan`, so a processor drops in cleanly.
- **Current placeholder price** ([`pricing.ts`](lib/pricing.ts)): $6/mo, $5/mo
  annual. Target: **€3–5**.

---

## 2. Variable cost per subscriber

### LLM (Gemini 2.5 Flash, paid tier ≈ $0.30 / 1M in, $2.50 / 1M out)
- Per email: ~800 in + ~350 out ≈ **$0.0011**
- 1 email/day → **~€0.03 / subscriber / month**; heavy Daily plan (~65 emails) → **~€0.07**
- Haiku 4.5 fallback ($1/$5 per 1M): ~€0.08/mo at 1/day — still trivial.

**On the free tier:** the Gemini AI Studio free tier caps ~250 requests/day on 2.5
Flash *and* may train on your data — unusable for a paid, privacy-sensitive
product. The paid tier costs cents; switch to it. The multi-key + Anthropic
fallback already in the codebase is the right safety net.

### Email (Resend)
- Free: 3,000/mo but **100/day** (≈100 daily subscribers).
- Pro $20/mo = 50,000 emails ≈ **1,600 subscribers** at 1/day → **~€0.01/sub/mo** at scale.

➡️ **Total infra variable cost ≈ €0.04–0.10 per subscriber per month** — a rounding
error against €3–5.

---

## 3. Fixed cost (by stage)

The app is **two deployables** — the Next.js site and a separate stateless NestJS
engine — plus a scheduler that fires the daily-send endpoint every ~15 min. Two
hosting paths, picked by how much ops you want to run yourself:

| Component | Convenient | Budget |
|---|---|---|
| Next.js site | **Vercel Pro $20/mo** (Hobby forbids commercial use) | Cloudflare Pages (free) — or the VPS below |
| NestJS engine | Railway / Render **~$5–7/mo** | runs on the same VPS |
| Both on one box | — | **Hetzner VPS ~€4/mo** (PM2/Docker + Caddy for TLS) |
| 15-min send cron | Vercel Cron (requires Pro) | cron-job.org or system crontab — **free** |
| **Hosting subtotal** | **~$25–27/mo** | **~€4/mo** (≈€0 if site on Cloudflare free + free engine tier) |

Trade-off: the budget path is ~€4/mo but you patch and monitor the box yourself;
the convenient path is push-to-deploy for ~5× the cost. Both serve the same code.

Stack cost by stage (**budget hosting** as baseline):

| Stage | Hosting | Resend | Supabase | LLM | **~Total/mo** |
|---|---|---|---|---|---|
| **0–100 subs** | ~€4 | Free | Free | ~€0–3 | **~€5–7** |
| **100–1,600 subs** | ~€4 | Pro $20 | Pro $25 | ~€5–50 | **~€50–70** |
| **Scale (10k+)** | ~€20+ | Scale $90+ | Pro + usage | usage | **~€150+** |

On the convenient path, add ~$20/mo at every stage (Vercel Pro + managed engine).
Plus PostHog (free to ~1M events) and the domain (**$10/yr**). Either way infra is
**not** the constraint — it's a rounding error against the §7 progression.

---

## 4. Payment setup — you are a non-EU (North Macedonia) seller

This single fact reshapes the whole payment + tax decision.

### Why you almost have to use a Merchant of Record
- **No EU OSS for you.** EU-based sellers remit cross-border VAT through the Union
  One-Stop-Shop. You can't — you're outside the EU. Selling digital services
  *directly* to EU consumers would force you onto the **non-Union OSS** scheme:
  register in one EU state and charge each customer's national VAT **from the very
  first sale** (no threshold for non-EU sellers). That's a real, ongoing filing
  burden for a solo operator.
- **Stripe likely won't onboard you.** North Macedonia is **not** among Stripe's
  ~46 supported seller countries (being in the SEPA zone only affects payment
  rails, not merchant eligibility). So "go direct on Stripe" probably isn't even
  available without incorporating abroad.

➡️ **A Merchant of Record (MoR) is the practical route, not just the convenient
one.** The MoR becomes the legal seller to your customers and **collects and remits
EU VAT, UK VAT, US sales tax, everything, everywhere.** You never register for or
file a single foreign tax return. You just receive net payouts.

### Which MoR
- **Paddle ⭐** — sells in 200+ countries, onboards sellers and pays out almost
  anywhere not under sanctions (North Macedonia qualifies), via bank wire /
  Payoneer. Most likely to actually work for a NM-based business.
- **Lemon Squeezy** — now Stripe-owned and pays out *through Stripe*; since Stripe
  doesn't support NM, payouts likely can't reach a Macedonian bank. **Verify before
  relying on it** — probably a no for you.
- Receiving money: expect EUR/USD payouts via **Payoneer or wire** into a
  Macedonian bank account.

### The fixed per-transaction fee is brutal on monthly micro-subs
MoR fee ≈ **5% + €0.50** per transaction. That €0.50 is a huge slice of a €3
charge. **Annual prepay is the single biggest lever:**

| Scenario | Fee drag |
|---|---|
| €3/mo **monthly**, MoR | ~22% of price |
| €3/mo **billed annually** (€36), MoR | **~6%** |
| €5/mo **monthly**, MoR | ~15% |

Push annual hard — [`pricing.ts`](lib/pricing.ts) already supports it.

---

## 5. Your own taxes in North Macedonia

Keep two taxes mentally separate:

**① Consumption tax on each sale (the customer's country VAT/sales tax)** —
handled 100% by the MoR. Either added on top of your price (US sales tax, often) or
baked into a tax-inclusive price (EU VAT, often). Not your filing problem. This is
the "VAT" line in §6 — it's the *customer's* tax, never your money.

**② Income tax on your profit (North Macedonia)** — and here the regime is a
genuine advantage. For a qualifying **small/micro legal entity (a ДОО / LLC)**,
excluding banking/finance/insurance/gaming:

| Annual company income | Profit tax |
|---|---|
| ≤ **MKD 3,000,000** (~€48,800) | **0% — exempt** |
| MKD 3,000,001 – 6,000,000 (~€48,800–97,600) | **1% of total revenue** (elective) |
| > MKD 6,000,000 (~€97,600) | **10% of profit** (standard CIT) |

Notes and caveats:
- This exemption is for a **company (ДОО)**. A sole proprietor (трговец поединец)
  pays the flat **10% personal income tax** with *no* small-business exemption — so
  the entity structure you choose directly changes your tax bill. Discuss ДОО vs
  sole trader with an accountant.
- The 0% applies to **retained company profit**. Money you take out as salary or
  dividend is still personal income (~10%) plus any social contributions — so it's
  not "zero tax all the way to your pocket," but it's very low and very simple.
- "Income" is total annual revenue from all sources. How your **MoR payouts** are
  recognised (gross sale vs net payout) must be confirmed — it determines which
  bracket you're in.

**③ North Macedonia VAT (ДДВ, 18%; registration threshold MKD 2,000,000 ≈
€32,500 turnover)** — your sales are to foreign customers (and, via the MoR, the
MoR is effectively your buyer), so they are normally **outside Macedonian VAT scope
(export of services)**, i.e. no 18% charged. But the registration threshold and the
place-of-supply treatment must be confirmed locally. Likely a non-issue for foreign
revenue; don't assume it for any domestic sales.

---

## 6. Unit economics (recommended setup)

Blended **€4 ARPU** (50% €5/mo monthly + 50% €36/yr annual), **Paddle MoR**
(~5% + €0.50), prices tax-inclusive, ~21% blended destination consumption tax
(EU-weighted; lower if your audience is US-heavy).

| Step | Value |
|---|---|
| Blended ARPU (what the customer pays) | €4.00/mo |
| − Destination VAT/sales tax (MoR remits, ~21%) | −€0.69 |
| − MoR fee (blended) | −€0.47 |
| − LLM | −€0.04 |
| **= Contribution / subscriber / month** | **≈ €2.80** |

(before shared fixed costs and before North Macedonia income tax)

---

## 7. Cost & profit progression with scaling

Destination tax + MoR fee + infra as in §6; income tax per the §5 brackets, keyed
to annual revenue received (~€34/sub/yr).

| Paying subs | Gross MRR | − Dest. tax | − Fees | − Infra¹ | Profit before income tax | MK income tax² | **After-tax profit/mo** |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 50 | €200 | €35 | €24 | €4 | €138 | 0% | **€138** |
| 100 | €400 | €69 | €47 | €47 | €237 | 0% | **€237** |
| 250 | €1,000 | €174 | €118 | €53 | €656 | 0% | **€656** |
| 500 | €2,000 | €347 | €235 | €64 | €1,354 | 0% | **€1,354** |
| 1,000 | €4,000 | €694 | €470 | €86 | €2,750 | 0% | **€2,750** |
| 2,500 | €10,000 | €1,735 | €1,175 | €236 | €6,854 | 1% (~€71) | **€6,783** |
| 5,000 | €20,000 | €3,470 | €2,350 | €480 | €13,700 | 10%³ | **€12,330** |
| 10,000 | €40,000 | €6,940 | €4,700 | €950 | €27,410 | 10%³ | **€24,669** |

¹ Infra = LLM + Resend + Supabase + misc. Resend Pro (~€18) and Supabase Pro (~€23)
kick in ~100 subs (that's the small margin dip there); Resend Scale (~€83) ~2,500;
overage estimates above.
² Keyed to annual company revenue (~€34/sub/yr): **0% below ~1,430 subs**, **1% of
revenue from ~1,430–2,860 subs**, 10% above. Assumes a qualifying ДОО.
³ 10% is on **taxable profit after deductible costs** (marketing, salary, infra) —
so once you're spending to grow, the real bill is materially lower than 10% of the
pre-marketing profit shown.

### Where each €4 goes (steady state, ~1,000 subs)
```
Destination VAT/sales tax (MoR)  ~17%   ████████
Payment processor                ~12%   ██████
Infra (LLM+email+DB)              ~2%   █
Your income tax                   0%   ·   (exempt under ~1,430 subs)
──────────────────────────────────────────────
Your gross profit                ~69%   ██████████████████████████████████
```

Margin is **flat-to-improving** as you scale, and income tax is **zero until you're
past ~1,400 subscribers**, then trivial. The only meaningful cost of goods is the
payment processor.

---

## 8. Processor & structure crossover

The Stripe "migrate at scale" move that an EU seller would make **mostly doesn't
apply to you** — Stripe won't onboard a NM business, and going direct would dump
non-Union OSS filing on you. So:

- **Stay on Paddle (MoR) indefinitely** unless/until volume is large enough that the
  ~5% premium clearly outweighs the cost and hassle of setting up a foreign (EU/US)
  entity *plus* its own tax filings. That crossover is far out and probably never
  worth it at €3–5 price points for a solo operator.
- The cheap optimisation isn't switching processors — it's **maximising annual
  prepay** (cuts the fee drag from ~15–22% to ~6%, per §4) and **staying in the 0%
  income-tax band** by structuring as a ДОО.

---

## 9. The number that actually decides profit: CAC

§7 is profit at a *held* subscriber count. Reaching and holding each tier means
beating churn, and every new sub costs acquisition spend (MARKETING.md §6:
€300–1,000/mo to start).

- **LTV** ≈ €2.80/mo × lifetime. At ~10 months (≈10%/mo churn for a €3–5 consumer
  habit), **LTV ≈ €28.**
- For a healthy 3:1, keep **CAC under ~€9** per paid conversion.

While growing, most of the gross margin is reinvested into ads — the €2,750/mo at
1,000 subs is only "yours" once you stop spending to grow. **The real risk is CAC
and churn, not the stack and not tax.** Infra could 10× and barely dent this.

---

## 10. Recommendations

1. **Price €5/mo, annual ≈ €3/mo (€36/yr); make annual the default.** €3 monthly is
   fee-hostile; €3 belongs on the annual plan.
2. **Use Paddle as Merchant of Record.** It handles all global VAT/sales tax, works
   for a NM-based seller, and pays out via wire/Payoneer. (Lemon Squeezy probably
   can't pay you — verify.)
3. **Incorporate as a ДОО** to access the small-business profit-tax exemption
   (0% ≤ MKD 3M income). Confirm structure + how MoR payouts are booked with a
   Macedonian accountant.
4. **Switch Gemini to the paid tier now** — pennies, removes the rate cap and
   data-training exposure. Keep the Anthropic fallback.
5. **Replace the mock checkout** in [`actions.ts`](app/subscribe/actions.ts) — plan
   `id`s already map to `subscriptions.plan`, so it's a hosted Paddle checkout +
   webhook to flip `trial → active`.
6. **Watch CAC and churn, not infra or tax.** Margins are ~83% pre-tax and you're
   income-tax-exempt until ~1,400 subs; growth cost is the variable that decides the
   business.

---

## Sources (verify; figures change)

- North Macedonia CIT / small-business regime & exemption — [PwC Tax Summaries](https://taxsummaries.pwc.com/north-macedonia/corporate/taxes-on-corporate-income),
  [Ministry of Finance](https://finance.gov.mk/en-GB/oblasti/danok-na-dobivka)
- Personal income tax (10% flat) — [PwC Tax Summaries](https://taxsummaries.pwc.com/north-macedonia/individual/taxes-on-personal-income)
- VAT 18% + thresholds + e-Faktura — [PwC – Other taxes](https://taxsummaries.pwc.com/north-macedonia/corporate/other-taxes),
  [Anrok VAT guide](https://www.anrok.com/vat-software-digital-services/north-macedonia)
- Stripe supported countries — [Stripe global availability](https://stripe.com/global)
- Paddle supported seller countries / payouts — [Paddle docs](https://developer.paddle.com/concepts/sell/supported-countries-locales/)
