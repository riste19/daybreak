# Daybreak — Marketing Strategy

> One short, AI-written email every morning — personalized to your goals, habits,
> and tasks, in the tone you choose, at the time you set. No app. No feed. Just a
> calm start to the day.

This document covers positioning, branding, channels, content, paid ads, the
launch sequence, and the metrics that matter. It's written for the current stage:
**a waitlist landing page** funneling into a **3-day trial → paid subscription**.

---

## 1. Positioning & strategy foundation

### The core insight
Every productivity tool adds *another thing to check*. Daybreak is the opposite:
it comes to you, once, in the channel you already open first thing (email), and
then gets out of the way. **The product is the absence of an app.**

### One-sentence positioning
> For people who want to start the day with intention — without one more app,
> feed, or notification — Daybreak delivers a single personalized note each
> morning that points you at what matters today.

### What we are / are NOT
| We are | We are not |
|---|---|
| A calm, once-a-day ritual | A habit-tracker with streaks and guilt |
| Personal and specific to *your* goals | Generic daily-quote spam |
| Email-native (no app to install) | Another dashboard or feed |
| AI-written but human-warm | Cold, robotic, or hustle-bro |

### Target audiences (lead with #1, expand later)
1. **Intentional self-improvers (25–40)** — read newsletters, journal, use
   Notion/Todoist, follow Headspace/Stoic/Atomic Habits. *Primary.*
2. **Busy professionals & founders** — want focus, hate app sprawl.
3. **People rebuilding a routine** — new job, new city, recovery, post-burnout.
4. **Gift buyers** — "a daily nudge" is a giftable, low-commitment present.

### Differentiation pillars (use these everywhere)
- **Personalized, not generic** — shaped to *your* goals and today's tasks.
- **One email, zero noise** — anti-app, anti-feed, anti-doomscroll.
- **Your tone, your time** — gentle, tough-love, or witty; 6am or 9am.
- **Effortless** — 60-second setup, then it just shows up.

---

## 2. Branding

### Brand personality
Warm, grounded, quietly confident. The friend who texts you one good sentence in
the morning — not the coach screaming "RISE AND GRIND." Think Headspace's calm ×
a great newsletter's voice.

### Voice & tone rules
- Short sentences. Second person ("you," "your morning").
- Concrete over abstract: "what matters today," not "unlock your potential."
- Never hustle-culture, never shame-based. No "you're failing" framing.
- One idea per message. White space is a feature.

### Visual identity (matches the existing "Dawn" design tokens in the codebase)
- **Palette:** dawn gradient — warm peach/amber → soft rose → pale sky. Calm,
  sunrise-coded. Lots of off-white space.
- **Type:** Fraunces (display, warm serif) + Inter (body) — already in the repo.
- **Motif:** the horizon line / first light. A simple sunrise mark works as a
  logo and as an animated email header.
- **Imagery:** real morning moments — coffee, open window, a notebook — not
  stock "businesspeople high-fiving."
- **Anti-aesthetic:** no dark hustle, no neon, no busy dashboards.

### Naming/asset checklist
- Lock the handle **@daybreak** (or `@daybreakemail` / `@getdaybreak` if taken)
  consistently across X, Instagram, TikTok, LinkedIn, Reddit.
- Domain `daybreak.email` already in config — make sure email-from address and
  social handles match it.
- Build a tiny brand kit: logo, 3 colors, 2 fonts, 1 voice paragraph, 5 sample
  email screenshots. One Figma/PDF page.

---

## 3. Channels — where to post

Prioritized by fit. Don't do all of them — **pick 2 primary + 1 experimental**
and go deep.

### Tier 1 — Primary (start here)
- **Reddit** — highest-intent, lowest-cost. Be genuinely useful, not spammy.
  Subs: r/productivity, r/getdisciplined, r/selfimprovement, r/Journaling,
  r/DecidingToBeBetter, r/Habits, r/getmotivated. Strategy: answer "how do you
  stay consistent" threads, share the *idea* and a sample email, soft-link.
- **X / Twitter** — build-in-public + productivity niche. Post the sample emails
  as images (they're inherently shareable). Founder voice > brand voice early.
- **Product Hunt** — the launch moment (see §5). Drives a credibility spike,
  backlinks, and the first few hundred signups.

### Tier 2 — Scale once messaging is proven
- **TikTok / Instagram Reels** — "What my AI sent me this morning" reading-the-
  email format. Aesthetic morning-routine content performs well here. Short,
  vertical, screenshot-driven.
- **Instagram (feed + stories)** — sample emails as carousel posts; sunrise
  visual brand fits perfectly.
- **LinkedIn** — for the professional/founder audience; "intention over hustle"
  angle, plus build-in-public posts.

### Tier 3 — Compounding / long-game
- **SEO blog** (the repo already supports MDX): target "morning routine ideas,"
  "daily motivation that isn't cringe," "how to start the day with intention,"
  "best daily affirmation alternatives." Long-tail, buyer-intent.
- **Newsletter cross-promotion / sponsorships** — sponsor small productivity &
  mindfulness newsletters; the audience overlap is near-perfect.
- **Creator partnerships** — micro-influencers (10–100k) in productivity,
  journaling, and "that girl"/morning-routine niches. Gift free annual access
  for an honest "I tried it for 7 days" post.

### Communities to seed (not spam)
Indie Hackers, relevant Discords (productivity, Stoicism), Hacker News (Show HN
at launch), Quora answers on motivation/routine questions.

---

## 4. Content strategy

### The hero asset: the sample email itself
Daybreak's single most persuasive, most shareable artifact is **a screenshot of
a great morning email.** Build a library of 15–20, across personas (founder,
student, new-parent, marathon trainer, career-switcher) and tones (gentle,
tough-love, witty). Every channel reuses these.

### Content pillars (rotate)
1. **Sample emails** — the product, shown not told. (Highest share rate.)
2. **Anti-app / calm-tech POV** — "you don't need another dashboard." Builds the
   worldview that makes Daybreak make sense.
3. **Morning routine & intention tips** — useful, top-of-funnel, SEO.
4. **Build-in-public** — waitlist count, design decisions, launch progress.
   (Great on X/IG/LI; builds an audience that converts at launch.)
5. **Social proof** — testimonials, "day 30 with Daybreak" reflections.

### Repurposing engine (one idea → many posts)
A single sample email becomes: an X image post, an IG carousel, a TikTok reading,
a blog section, and a newsletter-ad creative. Produce once, cut five ways.

### Lifecycle / email content (you're an email company — model the craft)
- **Waitlist nurture:** welcome → the story/why → a sample email → "you're #X in
  line, here's early access." Don't go silent between signup and launch.
- **Onboarding (trial):** the 3-day trial is the make-or-break window. Day 0
  welcome, ensure the *first* morning email is excellent, day 2 "want to keep
  this?" with the upgrade path. The first email a user receives must be the best
  one they ever get.
- **Win-back:** the reactivation flow already exists in the product — pair it
  with a "your mornings miss you, here's a fresh 3-day trial" email.

---

## 5. Launch sequence

### Phase 0 — Now: waitlist building (pre-launch)
- Landing page live (done). Add a **live signup counter** + referral mechanic
  ("skip the line — share your link") to make the waitlist grow itself.
- Seed Reddit/X/communities with the idea + sample emails. Goal: **500–1,000
  waitlist emails** before launch so day 1 isn't a cold start.
- Build the sample-email library and 2 weeks of scheduled social content.

### Phase 1 — Launch week
- **Product Hunt launch** (Tue–Thu, 12:01am PT). Rally the waitlist to upvote/
  comment. Have the founder reply to every comment.
- **Show HN** + **Indie Hackers** post, same week, different angles.
- Email the entire waitlist with early-access + a founder's note.
- Convert waitlist → trial with a limited "founding member" price or perk.

### Phase 2 — Post-launch growth (weeks 2–8)
- Turn on a small paid budget (see §6) once organic messaging is validated.
- Start the SEO blog cadence (1–2 posts/week).
- Kick off 3–5 micro-influencer collabs.
- Double down on whichever Tier-1 channel converted best; cut the rest.

### Phase 3 — Scale
- Newsletter sponsorships at volume, affiliate/referral program, gifting
  campaign timed to New Year (peak "new routine" intent) and back-to-school.

---

## 6. Paid ads

**Don't start paid until organic proves the message converts.** Use free
channels to find the winning hook, *then* pay to amplify it.

### Budget posture
Start tiny: **$300–$1,000/month** to learn. Optimize for **cost per trial
start** and, more importantly, **cost per paid conversion** (the 3-day trial
means you'll know real CAC fast). Scale only channels with payback < your LTV.

### Channels, by priority
1. **Meta (Instagram + Facebook)** — best for this audience and creative format.
   The sample-email screenshots and "reading my morning email" video *are* the
   ads. Interest targeting: productivity apps, Headspace, Calm, Atomic Habits,
   journaling, Notion, Todoist. Test lookalikes off your waitlist once it's 1k+.
2. **TikTok ads** — if the organic Reels/TikToks work, amplify the winners.
   Cheap reach, native screenshot/reading format.
3. **Reddit ads** — narrow targeting to the exact subs above; low CPMs, high
   intent. Good for cheap experimentation.
4. **Google Search** — capture intent: "daily motivation email," "morning
   routine app alternative," "personalized affirmations." Smaller volume but
   high purchase intent.
5. **Newsletter sponsorships** (technically paid, behaves like organic) — often
   the best ROI for this product; audiences match exactly.

### Creative principles
- The email screenshot is the scroll-stopper — lead with it.
- Hook in the first line/frame: "I let an AI write me one email every morning.
  Here's what it said." Curiosity + the artifact.
- Always A/B the hook, not the whole ad. One variable at a time.

---

## 7. Conversion & growth mechanics

- **Referral on the waitlist** — "skip the line" sharing turns signups into
  reach. Cheapest growth you have.
- **Make the trial unmissable** — the first morning email must be genuinely
  great; that single email is your real conversion event.
- **Social proof loop** — quote real testimonials back into landing + ads as
  they arrive. Add a live count once it's impressive.
- **Gifting** — "give someone a better morning." Low-commitment, viral-friendly,
  peaks at New Year and holidays.
- **A/B test the landing page** (already scoped in the README): hero headline,
  form friction (email-only vs. two-field), CTA copy, sample-email placement,
  scarcity/social-proof framing.

---

## 8. Metrics — what to actually track

| Stage | Metric | Why |
|---|---|---|
| Awareness | Reach, impressions, profile/landing visits | Top of funnel |
| Acquisition | Waitlist signups, signup conversion rate | Pre-launch health |
| Activation | Trial starts, % who get & open email #1 | The real moment of truth |
| **Revenue** | **Trial → paid %, CAC, LTV, payback period** | The numbers that decide ad scale |
| Retention | Email open rate, churn, reactivation rate | Email co. = retention is the business |
| Referral | Referral signups, share rate, K-factor | Free growth |

**North-star metric:** *retained paying subscribers* (people still opening the
email at day 30+). Everything upstream serves that.

Instrument it: PostHog is already in the stack — track landing → signup → trial
→ paid → retained, and tag every channel with UTMs so you know what actually
works before spending more on it.

---

## 9. 30-day action checklist

**Week 1 — Foundation**
- [ ] Lock social handles + one-page brand kit
- [ ] Build the first 10 sample-email screenshots (multi-persona, multi-tone)
- [ ] Add live waitlist counter + referral "skip the line" to the landing page
- [ ] Set up PostHog funnel + UTM convention

**Week 2 — Seed organic**
- [ ] Start posting on 2 primary channels (recommend X + Reddit)
- [ ] Write 2 SEO blog posts (MDX is already supported in the repo)
- [ ] Begin build-in-public thread; share waitlist milestones

**Week 3 — Prep launch**
- [ ] Draft Product Hunt + Show HN + IndieHackers assets
- [ ] Line up 3–5 micro-influencers for launch-week posts
- [ ] Write the waitlist nurture + trial onboarding email sequence

**Week 4 — Launch & measure**
- [ ] Product Hunt launch (Tue–Thu)
- [ ] Email waitlist with early access + founding-member perk
- [ ] Review funnel; pick the one channel to scale; turn on a $300–500 test
      ad budget on the winning hook
