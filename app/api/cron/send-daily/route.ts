/**
 * Daily send job. Triggered by a scheduler (Vercel Cron, cron-job.org, a system
 * crontab — anything that GETs this URL with `Authorization: Bearer <CRON_SECRET>`)
 * and designed to run FREQUENTLY (≈ every 15 min), not once a day.
 *
 * On each run it sends to every active subscriber whose LOCAL clock has reached
 * their chosen send_time today and who hasn't been emailed yet today (in their own
 * timezone). Because selection is "local time has passed the slot AND not yet sent
 * today", a run at any point after the slot still delivers — so irregular cron
 * timing or a missed run self-heals rather than dropping the day's email.
 *
 * Guarded by CRON_SECRET, which is REQUIRED — if it isn't configured the endpoint
 * refuses to run rather than sitting open.
 */

import {
  getActiveSubscribersForSend,
  getRecentThemes,
  wasEmailSentSince,
  saveGeneratedEmail,
} from "@/lib/supabase/storage";
import { buildSendInputFromPrefs } from "@/lib/delivery/build-send-input";
import { engineHeaders } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const API_BASE = process.env.DAYBREAK_API_URL ?? "http://localhost:3002";
// Per-run cap (one Vercel function timeout). With ≈15-min runs each invocation
// only targets subscribers whose slot just came due, so this is per-slot headroom.
const MAX_PER_RUN = 100;
// Fallback send time (minutes past local midnight) when a subscriber has none set.
const DEFAULT_SEND_MINUTES = 7 * 60; // 07:00

/** Parse "HH:MM" → minutes since midnight, or null if malformed. */
function parseSendMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Minutes since local midnight in `timeZone` right now, plus the UTC instant of
 * that local midnight. The latter is `now − (minutes elapsed in the local day)`,
 * which is DST-safe and needs no date library.
 */
function localClock(
  now: Date,
  timeZone: string,
): { minutes: number; midnightUtcIso: string } {
  let hour = now.getUTCHours();
  let minute = now.getUTCMinutes();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    for (const part of parts) {
      if (part.type === "hour") hour = Number(part.value);
      else if (part.type === "minute") minute = Number(part.value);
    }
  } catch {
    // Invalid/unknown timezone → fall back to the UTC values above.
  }
  const minutes = hour * 60 + minute;
  const midnightUtcIso = new Date(now.getTime() - minutes * 60_000).toISOString();
  return { minutes, midnightUtcIso };
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured; refusing to run." },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let subscribers;
  try {
    subscribers = await getActiveSubscribersForSend();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Failed to load subscribers", detail }, { status: 500 });
  }

  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const { user, preferences } of subscribers) {
    if (sent >= MAX_PER_RUN) break;

    if (!preferences.primary_goal?.trim()) {
      skipped++;
      continue;
    }

    // Only fire once the subscriber's local time has reached their send slot.
    const sendMinutes = parseSendMinutes(preferences.send_time) ?? DEFAULT_SEND_MINUTES;
    const { minutes: localMinutes, midnightUtcIso } = localClock(
      now,
      preferences.timezone || "UTC",
    );
    if (localMinutes < sendMinutes) {
      skipped++;
      continue;
    }

    try {
      // Idempotency: at most one email per subscriber per LOCAL day.
      if (await wasEmailSentSince(user.id, midnightUtcIso)) {
        skipped++;
        continue;
      }

      const recentThemes = await getRecentThemes(user.id);
      const body = buildSendInputFromPrefs(user, preferences, recentThemes);

      const res = await fetch(`${API_BASE}/delivery/send`, {
        method: "POST",
        headers: engineHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      const result = (await res.json()) as {
        subject: string;
        theme: string;
        usedFallback: boolean;
      };

      await saveGeneratedEmail(user.id, {
        subject: result.subject,
        // SendDailyResult doesn't return the rendered body; history tracks theme
        // (for variety) and sent_at (for idempotency), which is enough for v1.
        body: "",
        theme: result.theme,
        used_fallback: result.usedFallback,
        generation_input: body as unknown as Record<string, unknown>,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return Response.json({ ok: true, total: subscribers.length, sent, skipped, failed });
}
