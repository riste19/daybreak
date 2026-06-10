# Onboarding question system

The morning-email onboarding is **fully schema-driven**. The UI renders entirely
from data in [`onboarding-schema.ts`](./onboarding-schema.ts), so adding a
category or question requires **zero component changes**.

```
lib/onboarding/
  onboarding-schema.ts   ← source of truth: categories, questions, showIf, resolve
  resolveAnswers.ts      ← pure: answers → { params, contextLines, flags }
  resolveAnswers.test.ts ← Vitest unit tests
components/onboarding/
  onboarding-flow.tsx    ← orchestrator (intro → categories → universal → done)
  category-grid.tsx      ← intro: pick life areas
  category-step.tsx      ← one calm screen per category (+ "Get more specific")
  question-renderer.tsx  ← switches on input type (the only place that knows types)
  universal-step.tsx     ← name / goal / tone / send time / note
  confirmation.tsx       ← "arrives tomorrow at {time}" + editable summary
  progress-dots.tsx      ← soft progress for chosen categories
  icon-map.ts            ← maps schema `icon` string → lucide component
app/start/page.tsx       ← the route that mounts the flow
```

## The UX contract (don't break these)

- The user picks the categories they care about — **as few as one**.
- Each category shows only **2–4 surface questions**, mostly tap-to-select chips.
- Deeper questions live behind **"Get more specific"** (`depth: "deeper"`), collapsed by default.
- Only two things are ever required: **≥1 category** and the **one-line goal**.
- Progress reads as **"you can stop anytime"**, never "N steps left".

## Add a new category

Append a `Category` to the `categories` array in `onboarding-schema.ts`:

```ts
{
  id: "outdoors",                 // unique, stable; namespaces its question ids
  label: "Outdoors & Nature",
  icon: "Leaf",                   // must exist in components/onboarding/icon-map.ts
  description: "Get outside more, however the weather behaves.",
  questions: [
    {
      id: "outdoors.goal",
      label: "What pulls you outside?",
      input: "single_select",
      depth: "surface",           // shows by default (keep surface to 2–4)
      options: [
        { value: "walk", label: "Daily walks" },
        { value: "adventure", label: "Bigger adventures" },
      ],
      resolve: {
        params: { themes: ["momentum"], focusWeight: 1 },
        context: "Outdoors goal: {label}.",
      },
    },
    // ...up to 4 surface, the rest `depth: "deeper"`
  ],
}
```

If you use an icon not already in `icon-map.ts`, add it there (one line) — that
file is the single UI touch-point for icons.

## Add a question to an existing category

Add a `Question` to that category's `questions` array. Pick an `input`:

| input            | stored value      | notes                                  |
| ---------------- | ----------------- | -------------------------------------- |
| `single_select`  | `string`          | one chip                               |
| `multi_select` / `chip_multi` | `string[]` | capped at `CAPS.multi` (5)             |
| `scale`          | `number`          | `scale: { min, max, minLabel, maxLabel }` |
| `short_text`     | `string`          | capped at `maxLength` (default `CAPS.text`) |

Set `depth: "surface"` only if it belongs in the light 2–4; otherwise `"deeper"`.

### Conditional reveal (`showIf`)

Reveal a question only when an earlier answer matches. Predicates are simple and
serializable — `{ questionId, operator, value }` with `equals | includes | gt | lt`:

```ts
{
  id: "fitness.days",
  label: "Which days?",
  input: "chip_multi",
  depth: "surface",
  options: WEEKDAYS,
  showIf: { questionId: "fitness.cadence", operator: "equals", value: "specific_days" },
  resolve: { context: "Training days: {label}." },
}
```

The same predicate is evaluated in the UI (to reveal) and in `resolveAnswers`
(so a hidden answer never leaks into the result).

## How answers become the email (`resolve`)

Every question carries a declarative `resolve` descriptor. `resolveAnswers()`
interprets it into:

- **`params`** — `tone`, weighted `focusAreas`, weighted `preferredThemes`.
- **`contextLines`** — short fragments folded into the model's context block.

```ts
resolve: {
  // applies whenever the question is answered
  params: { tone: "gentle", themes: ["reflection"], focusWeight: 1 },
  context: "Mindfulness intention: {label}.",

  // OR vary by chosen option value:
  paramsByOption: { direct: { tone: "direct" } },
  contextByOption: { direct: "Wants direct, accountable encouragement — be blunt." },
}
```

Context templates support tokens: `{value}` (raw), `{label}`/`{labels}` (option
label(s)). Tone is aggregated by vote; `universal.tone` overrides it if the user sets it.

## Validation & safety (enforced in the resolver)

- Caps live in `CAPS` and are enforced by `resolveAnswers` (text truncated, multi capped at 5).
- Free-text questions set `moderate: true` and are run through `screenText()`.
  **Distress and prompt-injection are not interpreted** — the line is dropped, a
  `flag` is raised for the real moderation layer, and the flow continues with a
  gentle default. `screenText` is a placeholder: swap its internals for the
  production moderator without changing `resolveAnswers`' shape.
- **Health** collects no free text by design (no medical specifics / diet numbers).
- **Mood** is selects-only and is *not* a mental-health intake.
- **Finance / Relationships** stay supportive — never advice framing, never probing.

## Submitting

`OnboardingFlow` calls `resolveAnswers()` on submit and builds:

```ts
{ rawAnswers: { selectedCategories, values }, params, contextLines, flags }
```

There is **no backend yet** (by design). Today the payload is logged and used to
render the confirmation. When `PUT /me/profile` exists, POST this object there;
the engine should consume `params` + `contextLines`, and keep `rawAnswers` so the
mapping can be re-resolved later if it improves.

## Tests

```bash
npm test          # vitest run
npm run test:watch
```

`resolveAnswers.test.ts` covers: tone mapping + override, skipped categories
contributing nothing, cap enforcement, `showIf` gating, distress/injection
flagging, and theme/focus weighting.
