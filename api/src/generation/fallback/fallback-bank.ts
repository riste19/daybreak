import type { ModelEmail } from "../domain/types";

/**
 * Hand-written fallback messages used when generation fails twice, or when the
 * input is blocked by moderation. Deliberately generic (no personalization) and
 * varied in tone so a fallback morning still feels intentional. Each stays well
 * within the output bounds (subject 3–80 chars, body ≤120 words, no markup).
 */
export const FALLBACK_BANK: readonly ModelEmail[] = [
  // ── gentle ──
  {
    subject: "One small step is enough",
    body: "Good morning. You don't have to do it all today — just the next small thing. Progress is quieter than we expect; it rarely announces itself. Be kind to yourself, take one gentle step, and let that be plenty for now.",
  },
  {
    subject: "Begin where you are",
    body: "Morning. There's no perfect moment waiting somewhere ahead — there's only this one, and it's enough to begin. Start small, start soft, start unsure. You can adjust as you go. What matters is that you meet today with a little willingness.",
  },
  {
    subject: "You're allowed to start slow",
    body: "Hello, and good morning. Some days ask for a sprint; most just ask that you show up. Today, simply arrive. Do the modest thing in front of you and trust that small, steady effort carries you further than any burst of intensity ever could.",
  },
  {
    subject: "A soft place to begin",
    body: "Morning. Before the day fills up, take one slow breath. You are not behind. You are exactly at the start of today, which is the only honest place to be. Pick one kind thing to do for the person you're becoming, and begin there.",
  },
  {
    subject: "Gentle counts too",
    body: "Good morning. Not every push forward is loud. Sometimes it looks like resting well, asking for help, or simply not giving up. Whatever shape today takes, let it be a little gentler than yesterday. That, too, is moving forward.",
  },

  // ── direct ──
  {
    subject: "Do the first thing",
    body: "Morning. Stop circling and start. The task you're avoiding is smaller than the dread around it. Pick the very first action, set a timer, and move. You don't need motivation — you need to begin. Begin, and the rest gets easier.",
  },
  {
    subject: "Today is the day you show up",
    body: "Good morning. No more waiting for the right mood. The work doesn't care how you feel; it only responds to what you do. Decide the one thing that matters most today and put it first. Protect it. Finish it. Then the day is already a win.",
  },
  {
    subject: "Less planning, more doing",
    body: "Morning. You already know what to do — you've planned it twice. Today, trade another plan for a single completed action. Done beats perfect. Done beats later. Choose the task, close the tabs, and get it done before the noise starts.",
  },
  {
    subject: "Make the hard call early",
    body: "Good morning. The thing you keep pushing to tomorrow gets heavier every time you move it. Handle it now, while it's still light. Five honest minutes of effort beats an hour of worry. Start with the worst task and watch the day open up.",
  },
  {
    subject: "Earn the evening",
    body: "Morning. Picture tonight: you, satisfied, because you did what you said you would. That version of you is built right now, in the first hour. Skip the scroll. Take the action. Show yourself you keep your own promises.",
  },

  // ── playful ──
  {
    subject: "Plot twist: you've got this",
    body: "Good morning, hero of this slightly chaotic story. Today's quest? One brave little task before the snacks. The villain is procrastination and, plot twist, it's terrified of you starting. So start badly, start grinning, but start. Adventure awaits, and so does coffee.",
  },
  {
    subject: "Your move, sunshine",
    body: "Morning! The day just rolled in wearing a fresh coat of possibility. Don't overthink it — poke one task with a stick and see what happens. Worst case, you learn something. Best case, you're unstoppable by lunch. Either way, you're moving, and that's the fun part.",
  },
  {
    subject: "Tiny win, big swagger",
    body: "Hey, good morning. Here's the deal: do one small thing well and strut about it shamelessly. Made the bed? Legend. Sent the email? Icon. Momentum loves a little theatre. Stack a couple of tiny wins and watch today start cheering for you.",
  },
  {
    subject: "Permission to be delightfully average",
    body: "Morning! Not every day needs to be a highlight reel. Today you're allowed to do good-enough things with great-enough energy. Pick a task, hum a little, get it done. Perfection's overrated and frankly exhausting. Go be cheerfully productive instead.",
  },
  {
    subject: "Snooze button: defeated",
    body: "Good morning, champion of the early scroll. You're up, you're vertical, that's already a plot point. Now sneak one real task in before your brain notices. Quick, while it's still sleepy. Done? Excellent. The day is yours and it owes you a snack.",
  },

  // ── stoic ──
  {
    subject: "Begin, calmly",
    body: "Morning. Today offers what every day offers: a set of choices within your control and a great many outside it. Tend to the first, release the second. Do your work steadily, expect friction, and let neither praise nor setback move you far from your center.",
  },
  {
    subject: "What is within your power",
    body: "Good morning. You cannot command the outcome, only the effort. So give the effort fully and hold the result loosely. Meet today's obstacles as practice, not punishment. The disciplined hour you spend now is yours regardless of how the day unfolds.",
  },
  {
    subject: "Steady is its own reward",
    body: "Morning. Feelings will rise and pass like weather; your task is to keep walking through them. Do the next right thing without drama. Consistency, repeated quietly over many ordinary days, is how a steady life is built. Begin that work again today.",
  },
  {
    subject: "Meet the day as it is",
    body: "Good morning. Waste no energy wishing today were easier; spend it becoming equal to today as it is. Obstacles are the material of progress, not the interruption of it. Take the first task without complaint, and let your actions, not your moods, define the morning.",
  },
  {
    subject: "Control the controllable",
    body: "Morning. Much of today will be noise you did not choose. Let it pass. Anchor instead to the few things you can govern: your attention, your effort, your response. Govern them well and the day, whatever it brings, will not have governed you.",
  },
] as const;

/** Deterministic, stateless fallback pick — stable for a given day. */
export function pickFallback(date: Date, bank: readonly ModelEmail[] = FALLBACK_BANK): ModelEmail {
  const dayIndex = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  const index = ((dayIndex % bank.length) + bank.length) % bank.length;
  return bank[index];
}
