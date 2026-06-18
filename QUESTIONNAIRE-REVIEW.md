# Daybreak Onboarding Questionnaire — Inventory & Review

Source of truth: [`lib/onboarding/onboarding-schema.ts`](lib/onboarding/onboarding-schema.ts)

**Totals:** 52 questions — 45 across 10 categories + 7 universal.
**Free-text:** 12 · **Multiselect:** 2 (both "Which days?", max 5) · **Required:** 2 (goal, email) · **Conditional:** 2 (both "Which days?").

Legend: **surface** = always shown · _deeper_ = revealed by "Get more specific" · 🔴 = needs a decision · 🟡 = improvement · 🟢 = fine.

---

## Part 1 — Full inventory

### 1. Fitness & Movement
*"Move in a way that feels good and sticks."*

- **fitness.goal** — What are you moving toward? *(single select)*
  → Strength · Endurance · Feeling lighter · Mobility · Just feeling good
- **fitness.cadence** — How often, roughly? *(single select)*
  → Most days · A few times a week · Specific days · When I can
- **fitness.days** — Which days? *(**MULTISELECT**, only if cadence = "Specific days")*
  → Mon · Tue · Wed · Thu · Fri · Sat · Sun
- **fitness.vibe** — Where are you right now? *(single select)*
  → Just starting · Getting back into it · Pretty consistent · Going hard
- **fitness.sport** _(deeper)_ — Any particular sport or activity? *(free text)*
  → "Running, climbing, lifting, yoga…"
- **fitness.timeofday** _(deeper)_ — When do you usually train? *(single select)*
  → Morning · Midday · Evening · It varies
- **fitness.working_around** _(deeper)_ — Anything you're being gentle with? *(free text)*
  → help: "Optional — keeps nudges kind. No medical detail needed." · "A cranky knee, low energy lately…"

### 2. Meditation & Mindfulness
*"A little more calm and presence in the day."*

- **meditation.intention** — What are you hoping for? *(single select)*
  → Calm · Focus · Better sleep · Presence
- **meditation.experience** — How familiar is this for you? *(single select)*
  → Brand new · Dabbled a bit · Regular practice
- **meditation.frequency** — How often would feel right? *(single select)*
  → Now and then · A few times a week · Daily
- **meditation.style** _(deeper)_ — A style you lean toward? *(single select)*
  → Breath · Body scan · Loving-kindness · Open awareness · Movement / walking
- **meditation.length** _(deeper)_ — How long feels doable? *(single select)*
  → ~5 min · ~10 min · 20 min+
- **meditation.obstacle** _(deeper)_ — What usually gets in the way? *(single select)*
  → Racing mind · Restlessness · Finding the time · Staying consistent

### 3. Work & Career
*"Show up to your work with a little more intention."*

- **work.focus** — What's the focus right now? *(single select)*
  → Growth · Balance · Job search · Leadership · Deep focus
- **work.friction** — What's the biggest friction? *(single select)*
  → Procrastination · Overwhelm · Motivation · Clarity · Confidence
- **work.tone** — How should we talk to you about it? *(single select)*
  → Gentle encouragement *(Warm and supportive)* · Straight talk *(Blunt, keep me accountable)* · Keep it playful *(Light and fun)* · Calm & stoic *(Grounded, no fuss)*
- **work.role** _(deeper)_ — What do you do? *(free text)*
  → "Designer, founder, nurse, student…"
- **work.project** _(deeper)_ — A specific project or goal? *(free text)*
  → "Ship the v2 launch, land a new role…"
- **work.procrastination_trigger** _(deeper)_ — When do you tend to stall? *(single select)*
  → Big, fuzzy tasks · Boring tasks · Getting started · Afternoon slump

### 4. Learning & Skills
*"Keep growing something you care about."*

- **learning.what** — What are you learning? *(free text)*
  → "Spanish, guitar, machine learning…"
- **learning.why** — What's drawing you to it? *(single select)*
  → Career · Curiosity · Creativity · Personal growth
- **learning.cadence** — When will you make time? *(single select)*
  → A little daily · A few times a week · Weekly · Specific days · Whenever I can
- **learning.days** — Which days? *(**MULTISELECT**, only if cadence = "Specific days")*
  → Mon · Tue · Wed · Thu · Fri · Sat · Sun
- **learning.milestone** _(deeper)_ — A milestone you're aiming at? *(free text)*
  → "Hold a 10-min conversation, finish the course…"
- **learning.method** _(deeper)_ — How do you like to learn? *(single select)*
  → Courses · Building things · Reading · Daily practice

### 5. Relationships & Connection *(sensitive)*
*"Show up a little more warmly for the people who matter."*

- **relationships.focus** — Who's on your mind? *(single select)*
  → Family · Partner · Friends · Meeting people
- **relationships.intention** — What would feel good to nurture? *(single select)*
  → Being present · Quality time · Reaching out more · Patience · Listening
- **relationships.goal** _(deeper)_ — Anything specific you're hoping for? *(free text)*
  → help: "Optional, and entirely yours — share only what you'd like to." · "Call my mum more, be more patient with my kid…"
- **relationships.pattern** _(deeper)_ — A pattern you'd like to soften? *(single select)*
  → Snapping when stressed · Withdrawing · Over-pleasing · Losing touch

### 6. Finance & Money *(sensitive)*
*"A calmer, steadier relationship with money."*

- **finance.focus** — What's the focus? *(single select)*
  → Saving · Spending habits · Earning more · Peace of mind
- **finance.tone** — How does money tend to feel? *(single select)*
  → A bit anxious · I'd rather not look · Hopeful · Pretty in control
- **finance.goal** _(deeper)_ — A goal you're moving toward? *(free text)*
  → help: "No numbers needed — just the gist." · "Build a cushion, stop impulse buying…"
- **finance.habit** _(deeper)_ — A habit to build? *(single select)*
  → Track spending · Keep a budget · Save automatically · Pause before buying

### 7. Creativity & Craft
*"Make more of the thing you love making."*

- **creativity.medium** — What do you make? *(single select)*
  → Writing · Visual art · Music · Performance · Making / craft · Something else
- **creativity.want** — What do you want from it right now? *(single select)*
  → Consistency · Finish a project · Play more
- **creativity.blocker** — What's the usual blocker? *(single select)*
  → Time · Fear of it being bad · Perfectionism · Focus · Inspiration
- **creativity.project** _(deeper)_ — A project you're in the middle of? *(free text)*
  → "A short story, an EP, a series of paintings…"
- **creativity.resistance** _(deeper)_ — When does the resistance hit hardest? *(single select)*
  → Starting · The messy middle · Sharing it · Finishing

### 8. Health & Recovery *(sensitive — selects only, no free text by design)*
*"Small, kind habits that help you feel more like yourself."*

- **health.focus** — What would help most? *(single select)*
  → Sleep · Energy · Eating habits · Stress
- **health.approach** — How do you want to approach it? *(single select)*
  → Gently *(Soft nudges, no pressure)* · With structure *(Clear, steady habits)*
- **health.habit** _(deeper)_ — A gentle habit to lean into? *(single select)*
  → Drink more water · Move a little daily · A wind-down routine · Screen breaks · Regular meals
- **health.reduce** _(deeper)_ — Something to gently dial back? *(single select)*
  → Late-night screens · Late caffeine · Sitting for hours · Skipping breaks

### 9. Spirituality & Meaning *(sensitive)*
*"Room for what feels bigger, however you hold it."*

- **spirituality.orientation** — What are you drawn toward? *(single select)*
  → Gratitude · Purpose · Connection · Stillness
- **spirituality.frequency** — How often do you make space for it? *(single select)*
  → Daily · Weekly · Now and then
- **spirituality.practice** _(deeper)_ — A practice that resonates? *(single select)*
  → Gratitude list · Prayer or reflection · Time in nature · Meditation · Journaling
- **spirituality.question** _(deeper)_ — A question you're sitting with? *(free text)*
  → help: "Optional. No right answer — just what's alive for you." · "What matters most to me right now?"

### 10. Mood & Inner Life *(sensitive — selects only by design)*
*"Meet yourself where you are each morning."*

- **mood.help** — What would help most in the morning? *(single select)*
  → Encouragement · Grounding · Perspective · Celebration
- **mood.directness** — How direct do you want it? *(single select)*
  → Soft & gentle · Balanced · Direct · No-nonsense
- **mood.recurring** _(deeper)_ — A feeling you'd like to meet differently? *(single select)*
  → Self-doubt · Overwhelm · Restlessness · Comparison · Low motivation

### Universal *(asked once, at the end)*

- **universal.name** — What should we call you? *(free text)* → "First name is plenty"
- **universal.goal** — In one line — what's the goal? *(free text, **REQUIRED**)*
  → help: "The one thing your mornings should keep gently pointing you toward." · "Write every day, get stronger, be more patient…"
- **universal.email** — Where should your mornings land? *(email, **REQUIRED**)*
  → help: "We send one short email a day. No spam, leave anytime." · "you@example.com"
- **universal.tone** — Overall, how should it sound? *(single select)*
  → help: "We've pre-filled this from your answers — change it if it's not quite right." · Gentle · Direct · Playful · Stoic
- **universal.sendTime** — When should it land? *(time picker, HH:MM)*
- **universal.timezone** — Your time zone *(timezone picker, IANA)*
- **universal.note** — Anything else your mornings should know? *(free text)*
  → "Optional — a feeling, a season of life, a reminder to yourself…"

---

## Part 2 — Cross-cutting issues

### 🔴 A. Tone is asked three separate times
`work.tone` ("How should we talk to you about it?"), `mood.directness` ("How direct do you want it?"), and `universal.tone` ("Overall, how should it sound?") all collect the same signal. A user can give **conflicting** answers (Straight talk in Work, Soft & gentle in Mood), and it's unclear which wins. It's also inconsistent that **only Work** has a category-level tone question — no other category does.
**Fix:** keep `universal.tone` as the single source of truth. Drop `work.tone`; fold `mood.directness` into it or make `mood.directness` clearly about *delivery within mood support only*. Document the precedence rule.

### 🔴 B. "How often / cadence / frequency" — unclear what it changes
`fitness.cadence`, `meditation.frequency`, `learning.cadence`, `spirituality.frequency` ask how often the user does the activity. But the email ships **daily regardless**. Unless cadence actually drives content (e.g. "today's a rest day"), these are friction without payoff.
**Fix:** either (a) define how cadence changes the email and keep it, or (b) cut these and keep only the day-specific reveals that have a clear use.

### 🟡 C. "Specific days" is the wrong axis inside a frequency question
In `fitness.cadence` and `learning.cadence`, "Specific days" sits next to "Most days / A few times a week / When I can". The others answer *how often*; "Specific days" answers *which*. It only exists to trigger the day-picker reveal.
**Fix:** ask frequency first, then a separate "Same days each week?" yes/no that reveals the day picker — or merge into one "Which days?" multiselect and drop the cadence framing.

### 🟡 D. Single-select where multi fits better
- `relationships.focus` ("Who's on your mind?") — people rarely fall into one bucket; family **and** partner **and** friends is common.
- `health.focus` ("What would help most?") — sleep and stress often go together.
- `fitness.goal` — strength and feeling lighter aren't mutually exclusive.
**Fix:** consider `multi_select` (cap already exists at 5) for these.

### 🟡 E. Deeper questions that assume a surface answer but don't gate on it
`work.procrastination_trigger` ("When do you tend to stall?") shows for everyone, even someone whose friction was "Confidence" or "Clarity" — not procrastination.
**Fix:** add `showIf: work.friction == procrastination`, or rephrase generically.

### 🟡 F. Redundant / overlapping pairs
- `creativity.blocker` (Time/Fear/Perfectionism/Focus/Inspiration) vs `creativity.resistance` (Starting/Messy middle/Sharing/Finishing) — to a user these feel like the same question twice.
- The whole **Meditation** category vs `spirituality.practice = "Meditation"` — overlapping concepts a user may answer in both.
**Fix:** merge the creativity pair or clearly differentiate (what blocks vs when it hits); accept or de-dupe the meditation overlap.

### 🟡 G. Inconsistent free-text placement
`learning.what` is free-text **at surface** (the only category whose first question makes you type), while every other category opens with taps and keeps free-text in _deeper_. Health and Mood have none by design.
**Fix:** decide a rule — surface = tap-to-select everywhere; push `learning.what` detail to deeper, or give it quick chips (Language / Instrument / Tech / Other).

---

## Part 3 — Per-question wording fixes

| Question | Issue | Suggested rewrite |
|----------|-------|-------------------|
| **fitness.vibe** | "Where are you right now?" reads as location/mood; options are experience level | "How's it going lately?" or "What stage are you at?" |
| **fitness.working_around** | "Anything you're being gentle with?" is oblique; meaning only clear from placeholder | "Anything to work around right now?" (keep gentle help text) |
| **finance.tone** | "How does money tend to feel?" — money doesn't feel | "How do you feel about money lately?" |
| **work.friction** | "friction" is mild jargon | "What gets in the way most?" |
| **creativity.medium** | "Something else" is a dead-end value — no way to say what | reveal a short free-text "What do you make?" when "Something else" is picked |
| **mood.directness** | "Direct" and "No-nonsense" are near-duplicate options; collapses to a 2-point scale | reduce to Soft · Balanced · Direct, or make it a 1–5 scale |
| **fitness.cadence / learning.cadence** | "Specific days" mixed-axis (see Part 2-C) | split frequency from the day picker |
| **universal.sendTime** | label "When should it land?" is fine, but sits far from timezone it depends on | group sendTime + timezone visually as one "Delivery" step |

---

## Suggested priority order
1. **Resolve the tone triplication (A)** — biggest source of conflicting/confusing input.
2. **Decide the cadence questions' purpose (B, C)** — cut or justify; they touch 4 categories.
3. **Gate or rephrase `work.procrastination_trigger` (E).**
4. **Wording fixes (Part 3)** — low-risk, high-clarity.
5. **Multi-select reconsideration (D)** and **redundancy cleanup (F)** — nice-to-have.

---

## Part 4 — How the answers reach the email (the engine), and where they leak out

The pipeline:

```
onboarding answers
  → resolveAnswers()           lib/onboarding/resolveAnswers.ts
      { params:{tone, focusAreas, preferredThemes}, contextLines, flags }
  → buildGenerationInput()     lib/onboarding/buildGenerationInput.ts
      GenerationInput { name, primaryGoal, tone, customNotes, contextLines, preferredThemes, recentThemes }
  → GenerationService.generate()   api/src/generation/generation.service.ts
      selectTheme → moderateInput → buildPrompt → (LLM → validateOutput) ×10 → fallback
  → buildPrompt()              api/src/generation/prompt/build-prompt.ts
      SYSTEM_INSTRUCTION  +  USER DATA block  +  OUTPUT PLAN
```

Tracing every resolver output to where it actually lands surfaced several signals that
are **computed but never used** — fixing the questionnaire without fixing these means
better answers still won't change the email.

### 🔴 W1 — `focusAreas` is computed and then dropped
`resolveAnswers` weights and sorts the categories the user cares about most
(`params.focusAreas`). [`buildGenerationInput.ts`](lib/onboarding/buildGenerationInput.ts)
**never copies it into `GenerationInput`**, so it never reaches the prompt. The single
clearest "what does this person care about" signal is thrown away; the prompt has no
notion of category priority. (Confirmed: `focusAreas` appears only in the resolver, its
tests, and a doc comment — never in the engine.)
**Fix:** add `focusAreas` to `GenerationInput` (both the api schema and the mirror), pass
it through, and render it in the prompt; instruct the model to anchor on the top area.

### 🔴 W2 — `preferredThemes` is inert in the product flow
It only influences `selectTheme` **as a tiebreak**, and only when the calendar theme
collides with a `recentThemes` entry. But `buildGenerationInput` hardcodes
`recentThemes: []`, so there is never a collision → the calendar theme always wins →
`preferredThemes` is **never consulted in production**. The themes a user's answers lean
toward currently affect nothing.
**Fix (pick one):** (a) wire `recentThemes` persistence so recency/preference actually
engage; (b) give `preferredThemes` a bounded nudge on the calendar pick; or (c) accept
calendar-primary and instead pass `preferredThemes` into the prompt as flavor. At minimum,
document the decision so the dead wiring is intentional.

### 🔴 W3 — Tone collapses to one scalar that universal.tone overrides
`work.tone`, `mood.directness`, and `universal.tone` all vote into a single `tone`.
`universal.tone` is pre-filled and overrides the vote (`resolveTone`), so the two
category tone questions rarely change the result — and can silently contradict the user's
explicit pick. (This is Part 2-A seen from the engine: the extra tone questions are mostly
inert.)
**Fix:** single tone source (`universal.tone`). Either drop `work.tone`/`mood.directness`
or repurpose `mood.directness` as a *distinct* engine dimension (e.g. intensity) the prompt
actually consumes, rather than re-voting tone.

### 🟡 W4 — Context lines reach the prompt flat and unprioritized
`contextLines` are emitted in schema order (category order, then universal) and rendered
as a flat `- bullet` list. The model can't tell the user's #1 area from an afterthought.
The required goal is correctly separated, but everything else is an unordered dump.
**Fix:** order `contextLines` by `focusArea` weight in `buildGenerationInput`; optionally
group them under their focus area. (Cap already 20.)

### 🟡 W5 — The system prompt is thin (the "bigger/better prompt" opportunity)
[`SYSTEM_INSTRUCTION`](api/src/generation/prompt/build-prompt.ts) is one short paragraph:
write one email, 150–200 words, plain prose, match tone, center on theme. It does **not**
define what the four tones *mean* in voice, what the six themes *mean* (the model gets a
bare token like `theme: resistance`), how to use the inputs, or any voice/quality guardrails.
**Fix:** expand it with (1) one-line definitions per tone — the [fallback bank](api/src/generation/fallback/fallback-bank.ts)
already demonstrates all four and can be distilled; (2) one-line definitions per theme;
(3) input-usage guidance (anchor on the goal + top focus, weave context naturally, never
recite facts back); (4) voice anti-patterns (no toxic positivity, no clichés, not preachy,
not a therapist). Keep the JSON/word-count/plain-prose contract verbatim — `validateOutput`
and `build-prompt.test.ts` depend on it.

### 🟡 W6 — Sensitive-category care never propagates to generation
The schema is careful about sensitive categories (health = gentle habit framing, no diet
numbers; finance = supportive, never advice; mood = not a mental-health intake). Only the
distress **hard-block** propagates. Some per-option context lines carry "be reassuring,
never preachy," but that's sparse and inconsistent. The generation model has no standing
instruction to handle these gently.
**Fix:** add a short safety/voice section to the system prompt; optionally pass a
`sensitive: true` hint when any sensitive category is in focus.

### 🟡 W7 — `weekday` is in the prompt but day-specific answers aren't connected
`fitness.days` / `learning.days` emit "Training days: Mon, Wed, Fri" and the prompt
includes `weekday`, but nothing tells the model to cross-reference them ("today is a
training day → acknowledge it"). A nice personalization sits inert.
**Fix:** if we keep the day pickers, add prompt guidance to use `weekday` against them.

### Maintenance note (not a bug, but a trap)
Tone/Theme enums and the distress/injection regexes exist in **two copies** —
`lib/onboarding/*` and `api/src/generation/*` — by design (standalone packages). Any change
to tones, themes, or the `GenerationInput` shape must be made in both
[`buildGenerationInput.ts`](lib/onboarding/buildGenerationInput.ts) (the mirror) and
[`api/src/generation/domain/types.ts`](api/src/generation/domain/types.ts).

---

## Part 5 — Implementation plan

Sequenced so each phase is shippable on its own. Phases 2–3 are where the questionnaire
improvements actually start changing the email.

### Phase 0 — Decisions that gate scope (need sign-off)
- **Tone strategy** (W3 / 2-A): single `universal.tone`? Drop `work.tone`? Repurpose
  `mood.directness` as a real dimension or cut it?
- **Cadence questions** (2-B/2-C): cut them, or define how they change a daily email?
- **Theme wiring** (W2): defer persistence / bounded preference nudge / wire `recentThemes` now?
- **Multi-select** (2-D): convert `relationships.focus`, `health.focus`, `fitness.goal`?

### Phase 1 — Questionnaire clarity (low risk, no engine change)
Schema-only edits in [`onboarding-schema.ts`](lib/onboarding/onboarding-schema.ts):
- Wording fixes (Part 3): `fitness.vibe`, `fitness.working_around`, `finance.tone`, `work.friction`.
- Gate `work.procrastination_trigger` with `showIf: work.friction == procrastination` (E).
- `creativity.medium` "Something else" → reveal a free-text follow-up.
- Split the cadence/day-picker axis or remove cadence (per Phase 0).
- Trim `mood.directness` options / convert to scale (per Phase 0).
- Multi-select conversions (per Phase 0).
- **Update** [`resolveAnswers.test.ts`](lib/onboarding/resolveAnswers.test.ts) for any id/showIf changes.

### Phase 2 — Make the resolver's output count (engine wiring)
- Add `focusAreas` to `GenerationInput` in [`types.ts`](api/src/generation/domain/types.ts)
  **and** the mirror in [`buildGenerationInput.ts`](lib/onboarding/buildGenerationInput.ts); pass it through (W1).
- Render focus areas in [`build-prompt.ts`](api/src/generation/prompt/build-prompt.ts) and
  order `contextLines` by focus weight (W1, W4).
- Resolve `preferredThemes`/`recentThemes` per Phase 0 (W2).

### Phase 3 — Bigger, better system prompt (W5, W6, W7)
- Expand `SYSTEM_INSTRUCTION`: tone definitions, theme definitions, input-usage guidance,
  voice anti-patterns, sensitive-topic care. Distill tone voices from the fallback bank.
- Keep the JSON / 150–200 word / plain-prose contract exactly.
- **Update** [`build-prompt.test.ts`](api/src/generation/prompt/build-prompt.test.ts).

### Phase 4 — Verify
- Root workspace: `pnpm test` (vitest) — resolver + buildGenerationInput.
- `api/` workspace: its own vitest — prompt, validation, theme, service.
- Eyeball a generated sample via the debug/preview path if available.

**Recommended order:** Phase 1 → 2 → 3 (clarity first, then make answers count, then make
the model use them well). Phase 0 decisions block 1–3.
