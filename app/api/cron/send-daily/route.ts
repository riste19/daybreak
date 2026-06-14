/**
 * Daily send job, triggered by Vercel Cron (see vercel.json). For each active
 * subscriber not already emailed today, it builds the request from their saved
 * preferences and calls the engine's /delivery/send (which generates, renders and
 * sends), then records the send for idempotency + theme variety.
 *
 * Guarded by CRON_SECRET — Vercel Cron sends `Authorization: Bearer <secret>`.
 */

import {
  getActiveSubscribersForSend,
  getRecentThemes,
  wasEmailSentSince,
  saveGeneratedEmail,
} from "@/lib/supabase/storage";
import { buildSendInputFromPrefs } from "@/lib/delivery/build-send-input";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const API_BASE = process.env.DAYBREAK_API_URL ?? "http://localhost:3002";
const MAX_PER_RUN = 100; // v1 batch cap (within the Vercel function timeout)

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sinceIso = startOfDay.toISOString();

  let subscribers;
  try {
    subscribers = await getActiveSubscribersForSend();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Failed to load subscribers", detail }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const { user, preferences } of subscribers.slice(0, MAX_PER_RUN)) {
    if (!preferences.primary_goal?.trim()) {
      skipped++;
      continue;
    }
    try {
      if (await wasEmailSentSince(user.id, sinceIso)) {
        skipped++;
        continue;
      }

      const recentThemes = await getRecentThemes(user.id);
      const body = buildSendInputFromPrefs(user, preferences, recentThemes);

      const res = await fetch(`${API_BASE}/delivery/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
