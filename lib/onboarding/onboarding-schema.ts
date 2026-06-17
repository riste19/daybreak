/**
 * Daybreak onboarding — the question tree.
 *
 * THIS FILE IS THE SINGLE SOURCE OF TRUTH for the onboarding experience.
 * The entire UI renders from this data; adding a category or question here
 * requires ZERO component changes (see lib/onboarding/README.md).
 *
 * Design rules baked into the data:
 *  - Every category keeps its SURFACE questions short (2–4), mostly tap-to-select.
 *  - Anything heavier lives behind `depth: "deeper"` (revealed by "Get more specific").
 *  - Nothing is required except picking ≥1 category and the one-line goal.
 *  - Free-text fields are flagged `moderate: true` so the input-moderation layer
 *    (see resolveAnswers.ts → screenText) can screen them.
 *  - Each question declares how it `resolve`s into generation params + context.
 *
 * Keep the tree serializable: questions, options, and showIf predicates are
 * plain data. The only "logic" is in the declarative `resolve` descriptor,
 * which resolveAnswers.ts interprets.
 */

/* ───────────────────────────── Core types ───────────────────────────── */

export type InputType =
  | "single_select"
  | "multi_select"
  | "scale" // 1–5
  | "short_text"
  | "chip_multi"
  | "email"
  | "time" // local time-of-day, "HH:MM" (24h)
  | "timezone"; // IANA zone id

export type Depth = "surface" | "deeper";

/** Tone hints the engine can use to shape voice. */
export type Tone = "gentle" | "direct" | "playful" | "stoic";

/**
 * Delivery intensity — how blunt / forceful the voice is. Orthogonal to Tone:
 * a "playful" voice can still be "soft" or "direct". Set by mood.directness and
 * consumed by the prompt alongside tone.
 */
export type Intensity = "soft" | "balanced" | "direct";

/** Recurring themes the engine can weight when choosing what to say. */
export type Theme =
  | "gratitude"
  | "momentum"
  | "identity"
  | "small_wins"
  | "resistance"
  | "reflection";

export interface Option {
  /** Stable, serializable value stored in answers + used by showIf. */
  value: string;
  /** Human label shown on the chip/option. */
  label: string;
  /** Optional one-liner shown under the label for select cards. */
  hint?: string;
}

/* ─────────────────────── Conditional reveal (showIf) ─────────────────── */

export type ConditionOperator = "equals" | "includes" | "gt" | "lt";

/**
 * A simple, serializable predicate referencing an earlier answer in the SAME
 * category (or a universal answer). Evaluated by the UI to reveal a question,
 * and by resolveAnswers to skip resolving hidden questions.
 *
 *  - equals:   answer === value
 *  - includes: Array answer contains value
 *  - gt / lt:  Number(answer) > / < value
 */
export interface ShowIf {
  questionId: string;
  operator: ConditionOperator;
  value: string | number;
}

/* ─────────────────────────── Resolve descriptor ─────────────────────────
 * Declarative (serializable) map from an answer to generation params + a
 * context line. Two layers:
 *  - flat (`params` / `context`) apply whenever the question is answered.
 *  - per-option (`paramsByOption` / `contextByOption`) apply for the chosen
 *    option value(s) — this is how an option can nudge tone.
 *
 * Context templates support tokens, filled by resolveAnswers:
 *   {value}  → raw value, or comma-joined values for multi
 *   {label}  → option label, or comma-joined labels for multi
 *   {labels} → alias of {label}
 * ----------------------------------------------------------------------- */

export interface ParamContribution {
  /** Nudge overall tone toward this voice. */
  tone?: Tone;
  /** Set delivery intensity (how blunt/forceful). Resolved by vote like tone. */
  intensity?: Intensity;
  /** Add weight to these themes. */
  themes?: Theme[];
  /** Extra weight toward this question's category focus (default 1 per answer). */
  focusWeight?: number;
}

export interface ResolveDescriptor {
  params?: ParamContribution;
  paramsByOption?: Record<string, ParamContribution>;
  context?: string;
  contextByOption?: Record<string, string>;
}

/* ─────────────────────────────── Question ───────────────────────────── */

export interface Question {
  id: string;
  label: string;
  /** Optional helper text under the prompt. */
  help?: string;
  input: InputType;
  depth: Depth;
  options?: Option[]; // for select/chip types
  /** scale endpoints, defaults 1–5 with these labels */
  scale?: { min: number; max: number; minLabel?: string; maxLabel?: string };
  /** short_text character cap (defaults to TEXT_CAP). */
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  /** Free text routed through the moderation layer. */
  moderate?: boolean;
  /** Reveal only when this predicate passes. */
  showIf?: ShowIf;
  resolve?: ResolveDescriptor;
}

/* ─────────────────────────────── Category ───────────────────────────── */

export interface Category {
  id: string;
  label: string;
  /** lucide-react icon name; mapped to a component in the UI (icon-map.ts). */
  icon: string;
  description: string;
  /** Gentle categories get softer copy + extra care in the resolver. */
  sensitive?: boolean;
  questions: Question[];
}

/* ───────────────────────────── Validation caps ──────────────────────── */

export const CAPS = {
  /** Default cap for any short_text. */
  text: 120,
  /** The one required free-text goal. */
  goal: 150,
  /** The optional closing note. */
  note: 300,
  /** Max selections for chip_multi / multi_select (avoid context bloat). */
  multi: 5,
} as const;

/* ───────────────── Shared option sets (reused across tree) ───────────── */

const WEEKDAYS: Option[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

/* ════════════════════════════════════════════════════════════════════════
   CATEGORIES
   ════════════════════════════════════════════════════════════════════════ */

export const categories: Category[] = [
  /* 1 ───────────────────────── Fitness & Movement ───────────────────── */
  {
    id: "fitness",
    label: "Fitness & Movement",
    icon: "Dumbbell",
    description: "Move in a way that feels good and sticks.",
    questions: [
      {
        id: "fitness.goal",
        label: "What are you moving toward?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "strength", label: "Strength" },
          { value: "endurance", label: "Endurance" },
          { value: "weight", label: "Feeling lighter" },
          { value: "mobility", label: "Mobility" },
          { value: "general", label: "Just feeling good" },
        ],
        resolve: {
          params: { themes: ["momentum"], focusWeight: 1 },
          context: "Fitness goal: {label}.",
        },
      },
      {
        id: "fitness.days",
        label: "Any set days you train?",
        help: "Optional — tap the days you usually move. Lets your morning notice training days.",
        input: "chip_multi",
        depth: "surface",
        options: WEEKDAYS,
        resolve: { context: "Training days: {label}." },
      },
      {
        id: "fitness.vibe",
        label: "How's it going lately?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "just_starting", label: "Just starting" },
          { value: "back_at_it", label: "Getting back into it" },
          { value: "consistent", label: "Pretty consistent" },
          { value: "going_hard", label: "Going hard" },
        ],
        resolve: {
          paramsByOption: {
            just_starting: { tone: "gentle", themes: ["small_wins"] },
            back_at_it: { tone: "gentle", themes: ["momentum"] },
            going_hard: { themes: ["identity"] },
          },
          contextByOption: {
            just_starting: "Just starting out — celebrate small wins, no pressure.",
            back_at_it: "Getting back into it after a break.",
            consistent: "Already fairly consistent.",
            going_hard: "Training hard and motivated.",
          },
        },
      },
      // ── deeper ──
      {
        id: "fitness.sport",
        label: "Any particular sport or activity?",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Running, climbing, lifting, yoga…",
        resolve: { context: "Activity: {value}." },
      },
      {
        id: "fitness.timeofday",
        label: "When do you usually train?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "morning", label: "Morning" },
          { value: "midday", label: "Midday" },
          { value: "evening", label: "Evening" },
          { value: "varies", label: "It varies" },
        ],
        resolve: { context: "Usually trains in the {label}." },
      },
      {
        id: "fitness.working_around",
        label: "Anything to work around right now?",
        help: "Optional — keeps nudges kind. No medical detail needed.",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "A cranky knee, low energy lately…",
        resolve: { context: "Being gentle with: {value}." },
      },
    ],
  },

  /* 2 ──────────────────── Meditation & Mindfulness ──────────────────── */
  {
    id: "meditation",
    label: "Meditation & Mindfulness",
    icon: "Sparkles",
    description: "A little more calm and presence in the day.",
    questions: [
      {
        id: "meditation.intention",
        label: "What are you hoping for?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "calm", label: "Calm" },
          { value: "focus", label: "Focus" },
          { value: "sleep", label: "Better sleep" },
          { value: "presence", label: "Presence" },
        ],
        resolve: {
          params: { tone: "gentle", themes: ["reflection"], focusWeight: 1 },
          context: "Mindfulness intention: {label}.",
        },
      },
      {
        id: "meditation.experience",
        label: "How familiar is this for you?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "new", label: "Brand new" },
          { value: "some", label: "Dabbled a bit" },
          { value: "regular", label: "Regular practice" },
        ],
        resolve: {
          contextByOption: {
            new: "New to mindfulness — keep guidance simple and inviting.",
            regular: "Has an established practice.",
          },
        },
      },
      // ── deeper ──
      {
        id: "meditation.style",
        label: "A style you lean toward?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "breath", label: "Breath" },
          { value: "body_scan", label: "Body scan" },
          { value: "loving_kindness", label: "Loving-kindness" },
          { value: "open", label: "Open awareness" },
          { value: "movement", label: "Movement / walking" },
        ],
        resolve: { context: "Prefers {label} practice." },
      },
      {
        id: "meditation.length",
        label: "How long feels doable?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "5", label: "~5 min" },
          { value: "10", label: "~10 min" },
          { value: "20", label: "20 min+" },
        ],
        resolve: { context: "Comfortable with ~{value} min sits." },
      },
      {
        id: "meditation.obstacle",
        label: "What usually gets in the way?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "racing_mind", label: "Racing mind" },
          { value: "restless", label: "Restlessness" },
          { value: "time", label: "Finding the time" },
          { value: "consistency", label: "Staying consistent" },
        ],
        resolve: {
          params: { themes: ["resistance"] },
          context: "Main obstacle: {label}.",
        },
      },
    ],
  },

  /* 3 ───────────────────────── Work & Career ────────────────────────── */
  {
    id: "work",
    label: "Work & Career",
    icon: "Briefcase",
    description: "Show up to your work with a little more intention.",
    questions: [
      {
        id: "work.focus",
        label: "What's the focus right now?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "growth", label: "Growth" },
          { value: "balance", label: "Balance" },
          { value: "job_search", label: "Job search" },
          { value: "leadership", label: "Leadership" },
          { value: "focus", label: "Deep focus" },
        ],
        resolve: {
          params: { themes: ["momentum"], focusWeight: 1 },
          context: "Work focus: {label}.",
        },
      },
      {
        id: "work.friction",
        label: "What gets in the way most?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "procrastination", label: "Procrastination" },
          { value: "overwhelm", label: "Overwhelm" },
          { value: "motivation", label: "Motivation" },
          { value: "clarity", label: "Clarity" },
          { value: "confidence", label: "Confidence" },
        ],
        resolve: {
          params: { themes: ["resistance"] },
          context: "Biggest friction at work: {label}.",
        },
      },
      // ── deeper ──
      {
        id: "work.role",
        label: "What do you do?",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Designer, founder, nurse, student…",
        resolve: { context: "Role: {value}." },
      },
      {
        id: "work.project",
        label: "A specific project or goal?",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Ship the v2 launch, land a new role…",
        resolve: { context: "Current work goal: {value}." },
      },
      {
        id: "work.procrastination_trigger",
        label: "When do you tend to stall?",
        input: "single_select",
        depth: "deeper",
        // Only relevant when procrastination is the named friction.
        showIf: { questionId: "work.friction", operator: "equals", value: "procrastination" },
        options: [
          { value: "big_tasks", label: "Big, fuzzy tasks" },
          { value: "boring", label: "Boring tasks" },
          { value: "starting", label: "Getting started" },
          { value: "afternoon", label: "Afternoon slump" },
        ],
        resolve: { context: "Tends to stall on: {label}." },
      },
    ],
  },

  /* 4 ─────────────────────── Learning & Skills ──────────────────────── */
  {
    id: "learning",
    label: "Learning & Skills",
    icon: "GraduationCap",
    description: "Keep growing something you care about.",
    questions: [
      {
        id: "learning.what",
        label: "What are you learning?",
        input: "short_text",
        depth: "surface",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Spanish, guitar, machine learning…",
        resolve: { params: { focusWeight: 1 }, context: "Learning: {value}." },
      },
      {
        id: "learning.why",
        label: "What's drawing you to it?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "career", label: "Career" },
          { value: "curiosity", label: "Curiosity" },
          { value: "creative", label: "Creativity" },
          { value: "growth", label: "Personal growth" },
        ],
        resolve: {
          params: { themes: ["identity"] },
          context: "Learning for {label}.",
        },
      },
      {
        id: "learning.days",
        label: "Any set days you study?",
        help: "Optional — tap the days you usually practice. Lets your morning notice study days.",
        input: "chip_multi",
        depth: "surface",
        options: WEEKDAYS,
        resolve: { context: "Study days: {label}." },
      },
      // ── deeper ──
      {
        id: "learning.milestone",
        label: "A milestone you're aiming at?",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Hold a 10-min conversation, finish the course…",
        resolve: { params: { themes: ["small_wins"] }, context: "Milestone: {value}." },
      },
      {
        id: "learning.method",
        label: "How do you like to learn?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "courses", label: "Courses" },
          { value: "projects", label: "Building things" },
          { value: "reading", label: "Reading" },
          { value: "practice", label: "Daily practice" },
        ],
        resolve: { context: "Learns best by {label}." },
      },
    ],
  },

  /* 5 ──────────────────── Relationships & Connection ────────────────── */
  {
    id: "relationships",
    label: "Relationships & Connection",
    icon: "Users",
    description: "Show up a little more warmly for the people who matter.",
    sensitive: true,
    questions: [
      {
        id: "relationships.focus",
        label: "Who's on your mind?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "family", label: "Family" },
          { value: "partner", label: "Partner" },
          { value: "friends", label: "Friends" },
          { value: "social", label: "Meeting people" },
        ],
        resolve: { params: { focusWeight: 1 }, context: "Relationship focus: {label}." },
      },
      {
        id: "relationships.intention",
        label: "What would feel good to nurture?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "presence", label: "Being present" },
          { value: "quality_time", label: "Quality time" },
          { value: "reaching_out", label: "Reaching out more" },
          { value: "patience", label: "Patience" },
          { value: "listening", label: "Listening" },
        ],
        resolve: {
          params: { tone: "gentle", themes: ["reflection"] },
          context: "Wants to nurture: {label}.",
        },
      },
      // ── deeper ──
      {
        id: "relationships.goal",
        label: "Anything specific you're hoping for?",
        help: "Optional, and entirely yours — share only what you'd like to.",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Call my mum more, be more patient with my kid…",
        resolve: { context: "Connection hope: {value}." },
      },
      {
        id: "relationships.pattern",
        label: "A pattern you'd like to soften?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "reactivity", label: "Snapping when stressed" },
          { value: "withdrawing", label: "Withdrawing" },
          { value: "people_pleasing", label: "Over-pleasing" },
          { value: "staying_in_touch", label: "Losing touch" },
        ],
        resolve: {
          params: { themes: ["reflection"] },
          context: "Gently working on: {label}.",
        },
      },
    ],
  },

  /* 6 ───────────────────────── Finance & Money ──────────────────────── */
  {
    id: "finance",
    label: "Finance & Money",
    icon: "Wallet",
    description: "A calmer, steadier relationship with money.",
    sensitive: true,
    questions: [
      {
        id: "finance.focus",
        label: "What's the focus?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "saving", label: "Saving" },
          { value: "spending_habits", label: "Spending habits" },
          { value: "earning", label: "Earning more" },
          { value: "peace_of_mind", label: "Peace of mind" },
        ],
        resolve: { params: { focusWeight: 1 }, context: "Money focus: {label}." },
      },
      {
        id: "finance.tone",
        label: "How do you feel about money lately?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "anxious", label: "A bit anxious" },
          { value: "avoidant", label: "I'd rather not look" },
          { value: "hopeful", label: "Hopeful" },
          { value: "in_control", label: "Pretty in control" },
        ],
        resolve: {
          // Supportive only — never financial advice framing.
          paramsByOption: {
            anxious: { tone: "gentle", themes: ["reflection"] },
            avoidant: { tone: "gentle", themes: ["small_wins"] },
            in_control: { themes: ["momentum"] },
          },
          contextByOption: {
            anxious: "Money feels anxious — be reassuring, never preachy.",
            avoidant: "Tends to avoid money — keep it small and kind.",
            hopeful: "Feels hopeful about money.",
            in_control: "Feels in control of money.",
          },
        },
      },
      // ── deeper ──
      {
        id: "finance.goal",
        label: "A goal you're moving toward?",
        help: "No numbers needed — just the gist.",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "Build a cushion, stop impulse buying…",
        resolve: { context: "Money goal: {value}." },
      },
      {
        id: "finance.habit",
        label: "A habit to build?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "track", label: "Track spending" },
          { value: "budget", label: "Keep a budget" },
          { value: "auto_save", label: "Save automatically" },
          { value: "pause", label: "Pause before buying" },
        ],
        resolve: { params: { themes: ["small_wins"] }, context: "Building the habit: {label}." },
      },
    ],
  },

  /* 7 ─────────────────────── Creativity & Craft ─────────────────────── */
  {
    id: "creativity",
    label: "Creativity & Craft",
    icon: "Palette",
    description: "Make more of the thing you love making.",
    questions: [
      {
        id: "creativity.medium",
        label: "What do you make?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "writing", label: "Writing" },
          { value: "visual", label: "Visual art" },
          { value: "music", label: "Music" },
          { value: "performance", label: "Performance" },
          { value: "making", label: "Making / craft" },
          { value: "other", label: "Something else" },
        ],
        resolve: { params: { themes: ["identity"], focusWeight: 1 }, context: "Creative medium: {label}." },
      },
      {
        id: "creativity.medium_other",
        label: "What do you make?",
        input: "short_text",
        depth: "surface",
        maxLength: CAPS.text,
        moderate: true,
        // Only when "Something else" is chosen above — otherwise the medium is known.
        showIf: { questionId: "creativity.medium", operator: "equals", value: "other" },
        placeholder: "Pottery, film, woodworking…",
        resolve: { context: "Creative medium: {value}." },
      },
      {
        id: "creativity.want",
        label: "What do you want from it right now?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "consistency", label: "Consistency" },
          { value: "finish", label: "Finish a project" },
          { value: "play", label: "Play more" },
        ],
        resolve: {
          paramsByOption: {
            consistency: { themes: ["momentum"] },
            finish: { themes: ["small_wins"] },
            play: { tone: "playful", themes: ["small_wins"] },
          },
          context: "Creative aim: {label}.",
        },
      },
      {
        id: "creativity.blocker",
        label: "What's the usual blocker?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "time", label: "Time" },
          { value: "fear", label: "Fear of it being bad" },
          { value: "perfectionism", label: "Perfectionism" },
          { value: "focus", label: "Focus" },
          { value: "inspiration", label: "Inspiration" },
        ],
        resolve: { params: { themes: ["resistance"] }, context: "Creative blocker: {label}." },
      },
      // ── deeper ──
      {
        id: "creativity.project",
        label: "A project you're in the middle of?",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "A short story, an EP, a series of paintings…",
        resolve: { context: "Working on: {value}." },
      },
      {
        id: "creativity.resistance",
        label: "When does the resistance hit hardest?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "starting", label: "Starting" },
          { value: "middle", label: "The messy middle" },
          { value: "sharing", label: "Sharing it" },
          { value: "finishing", label: "Finishing" },
        ],
        resolve: { params: { themes: ["resistance"] }, context: "Resistance peaks at: {label}." },
      },
    ],
  },

  /* 8 ───────────────────────── Health & Recovery ────────────────────── */
  // SAFETY: gentle HABIT framing only. No medical specifics, diagnoses,
  // calorie/diet numbers, or anything that could feed disordered patterns.
  // Intentionally NO free-text fields in this category.
  {
    id: "health",
    label: "Health & Recovery",
    icon: "Leaf",
    description: "Small, kind habits that help you feel more like yourself.",
    sensitive: true,
    questions: [
      {
        id: "health.focus",
        label: "What would help most?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "sleep", label: "Sleep" },
          { value: "energy", label: "Energy" },
          { value: "nutrition_habits", label: "Eating habits" },
          { value: "stress", label: "Stress" },
        ],
        resolve: { params: { focusWeight: 1 }, context: "Wellbeing focus: {label}." },
      },
      {
        id: "health.approach",
        label: "How do you want to approach it?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "gentle", label: "Gently", hint: "Soft nudges, no pressure" },
          { value: "structured", label: "With structure", hint: "Clear, steady habits" },
        ],
        resolve: {
          paramsByOption: {
            gentle: { tone: "gentle", themes: ["small_wins"] },
            structured: { themes: ["momentum"] },
          },
          context: "Prefers a {label} approach to wellbeing.",
        },
      },
      // ── deeper ── (selects only, on purpose)
      {
        id: "health.habit",
        label: "A gentle habit to lean into?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "hydrate", label: "Drink more water" },
          { value: "move_daily", label: "Move a little daily" },
          { value: "wind_down", label: "A wind-down routine" },
          { value: "screen_break", label: "Screen breaks" },
          { value: "regular_meals", label: "Regular meals" },
        ],
        resolve: { params: { themes: ["small_wins"] }, context: "Leaning into: {label}." },
      },
      {
        id: "health.reduce",
        label: "Something to gently dial back?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "late_screens", label: "Late-night screens" },
          { value: "late_caffeine", label: "Late caffeine" },
          { value: "sitting_long", label: "Sitting for hours" },
          { value: "skipping_breaks", label: "Skipping breaks" },
        ],
        resolve: { context: "Gently dialling back: {label}." },
      },
    ],
  },

  /* 9 ─────────────────────── Spirituality & Meaning ─────────────────── */
  // Open and non-denominational. Never assume a tradition.
  {
    id: "spirituality",
    label: "Spirituality & Meaning",
    icon: "Compass",
    description: "Room for what feels bigger, however you hold it.",
    sensitive: true,
    questions: [
      {
        id: "spirituality.orientation",
        label: "What are you drawn toward?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "gratitude", label: "Gratitude" },
          { value: "purpose", label: "Purpose" },
          { value: "connection", label: "Connection" },
          { value: "stillness", label: "Stillness" },
        ],
        resolve: {
          params: { tone: "gentle", focusWeight: 1 },
          paramsByOption: {
            gratitude: { themes: ["gratitude"] },
            purpose: { themes: ["identity"] },
            connection: { themes: ["reflection"] },
            stillness: { themes: ["reflection"] },
          },
          context: "Drawn toward {label}.",
        },
      },
      {
        id: "spirituality.practice",
        label: "A practice that resonates?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "gratitude_list", label: "Gratitude list" },
          { value: "prayer_reflection", label: "Prayer or reflection" },
          { value: "nature", label: "Time in nature" },
          { value: "meditation", label: "Meditation" },
          { value: "journaling", label: "Journaling" },
        ],
        resolve: { context: "Resonates with: {label}." },
      },
      // ── deeper ──
      {
        id: "spirituality.question",
        label: "A question you're sitting with?",
        help: "Optional. No right answer — just what's alive for you.",
        input: "short_text",
        depth: "deeper",
        maxLength: CAPS.text,
        moderate: true,
        placeholder: "What matters most to me right now?",
        resolve: { params: { themes: ["reflection"] }, context: "Sitting with: {value}." },
      },
    ],
  },

  /* 10 ───────────────────────── Mood & Inner Life ───────────────────── */
  // STRONGLY informs voice: mood.help nudges tone, mood.directness sets delivery
  // intensity. This is NOT a mental-health intake: no questions about crisis,
  // self-harm, diagnoses, or symptoms. Selects only — distress screening lives in
  // the resolver for the universal free-text fields.
  {
    id: "mood",
    label: "Mood & Inner Life",
    icon: "CloudSun",
    description: "Meet yourself where you are each morning.",
    sensitive: true,
    questions: [
      {
        id: "mood.help",
        label: "What would help most in the morning?",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "encouragement", label: "Encouragement" },
          { value: "grounding", label: "Grounding" },
          { value: "perspective", label: "Perspective" },
          { value: "celebration", label: "Celebration" },
        ],
        resolve: {
          params: { focusWeight: 1 },
          paramsByOption: {
            encouragement: { themes: ["momentum"] },
            grounding: { tone: "stoic", themes: ["reflection"] },
            perspective: { themes: ["reflection"] },
            celebration: { tone: "playful", themes: ["small_wins"] },
          },
          context: "Mornings, they'd most like: {label}.",
        },
      },
      {
        id: "mood.directness",
        label: "How direct do you want it?",
        help: "Separate from the overall voice — this is how blunt the delivery feels.",
        input: "single_select",
        depth: "surface",
        options: [
          { value: "soft", label: "Soft & gentle" },
          { value: "balanced", label: "Balanced" },
          { value: "direct", label: "Direct" },
        ],
        resolve: {
          // Sets the delivery INTENSITY (orthogonal to tone), consumed by the prompt.
          paramsByOption: {
            soft: { intensity: "soft" },
            balanced: { intensity: "balanced" },
            direct: { intensity: "direct" },
          },
          contextByOption: {
            soft: "Wants a soft, unhurried delivery.",
            direct: "Wants a direct, no-fuss delivery.",
          },
        },
      },
      // ── deeper ── (safe selects only)
      {
        id: "mood.recurring",
        label: "A feeling you'd like to meet differently?",
        input: "single_select",
        depth: "deeper",
        options: [
          { value: "self_doubt", label: "Self-doubt" },
          { value: "overwhelm", label: "Overwhelm" },
          { value: "restlessness", label: "Restlessness" },
          { value: "comparison", label: "Comparison" },
          { value: "low_motivation", label: "Low motivation" },
        ],
        resolve: {
          params: { themes: ["reflection", "resistance"] },
          context: "Would like to meet {label} a little differently.",
        },
      },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════════
   UNIVERSAL QUESTIONS — asked once, at the end, kept minimal.
   `name` is the category id used to namespace these in the answers map.
   ════════════════════════════════════════════════════════════════════════ */

export const UNIVERSAL_CATEGORY_ID = "universal";

export const universalQuestions: Question[] = [
  {
    id: "universal.name",
    label: "What should we call you?",
    input: "short_text",
    depth: "surface",
    maxLength: CAPS.text,
    moderate: true,
    placeholder: "First name is plenty",
    resolve: { context: "Their name is {value}." },
  },
  {
    id: "universal.goal",
    label: "In one line — what's the goal?",
    help: "The one thing your mornings should keep gently pointing you toward.",
    input: "short_text",
    depth: "surface",
    maxLength: CAPS.goal,
    moderate: true,
    required: true,
    placeholder: "Write every day, get stronger, be more patient…",
    resolve: { params: { themes: ["identity"] }, context: "Primary goal: {value}." },
  },
  {
    id: "universal.email",
    label: "Where should your mornings land?",
    help: "We send one short email a day. No spam, leave anytime.",
    input: "email",
    depth: "surface",
    maxLength: 254,
    required: true,
    placeholder: "you@example.com",
    // No `resolve`: delivery metadata, deliberately kept out of the model context.
  },
  {
    id: "universal.tone",
    label: "Overall, how should it sound?",
    help: "We've pre-filled this from your answers — change it if it's not quite right.",
    input: "single_select",
    depth: "surface",
    options: [
      { value: "gentle", label: "Gentle" },
      { value: "direct", label: "Direct" },
      { value: "playful", label: "Playful" },
      { value: "stoic", label: "Stoic" },
    ],
    // Overrides the aggregated tone vote — handled explicitly in resolveAnswers.
    resolve: {},
  },
  {
    id: "universal.sendTime",
    label: "When should it land?",
    help: "Pick the exact time you'd like it to arrive — we'll aim for this in your time zone.",
    input: "time",
    depth: "surface",
    // Delivery metadata — deliberately NOT part of the generation context.
  },
  {
    id: "universal.timezone",
    label: "Your time zone",
    help: "So your morning lands at the right local time. We've guessed it from your browser.",
    input: "timezone",
    depth: "surface",
    // Delivery metadata — no resolve.
  },
  {
    id: "universal.note",
    label: "Anything else your mornings should know?",
    input: "short_text",
    depth: "surface",
    maxLength: CAPS.note,
    moderate: true,
    placeholder: "Optional — a feeling, a season of life, a reminder to yourself…",
    resolve: { context: "{value}" },
  },
];

/* ───────────────────────────── Lookups ──────────────────────────────── */

/** All questions across all categories + universal, flattened. */
export const allQuestions: Question[] = [
  ...categories.flatMap((c) => c.questions),
  ...universalQuestions,
];

const questionById = new Map<string, Question>(
  allQuestions.map((q) => [q.id, q]),
);

export function getQuestion(id: string): Question | undefined {
  return questionById.get(id);
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** Schema bundle — the shape resolveAnswers and the UI consume. */
export const onboardingSchema = {
  categories,
  universalQuestions,
  caps: CAPS,
} as const;
