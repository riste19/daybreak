import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Waitlist storage — the ONE place persistence lives.
 *
 * Today: appends to a local JSON file for zero-cost local development.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Prompt 2): swap the body of `saveSignup` for a real free-tier store
 * (Supabase `waitlist` table, a Google Sheet, or an email-capture provider).
 * Keep this function's SIGNATURE identical so nothing else in the app changes.
 *
 * NOTE: a JSON file works in local dev only. On Vercel the serverless
 * filesystem is read-only/ephemeral, so the DB swap is required before the
 * waitlist can persist in production.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface Signup {
  email: string;
  note?: string;
  createdAt: string;
}

export type SaveResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "signups.json");

async function readAll(): Promise<Signup[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Signup[]) : [];
  } catch (err) {
    // Missing file on first run is expected; anything else we surface.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Persist a waitlist signup. Inputs are assumed already validated/normalized
 * by the caller (see lib/validation.ts). Never throws to the route — returns
 * a structured result so an email is never lost to a silent failure.
 */
export async function saveSignup(
  email: string,
  note?: string,
): Promise<SaveResult> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const signups = await readAll();

    if (signups.some((s) => s.email === email)) {
      return { ok: true, duplicate: true };
    }

    signups.push({
      email,
      ...(note ? { note } : {}),
      createdAt: new Date().toISOString(),
    });

    await fs.writeFile(DATA_FILE, JSON.stringify(signups, null, 2), "utf8");
    return { ok: true, duplicate: false };
  } catch (err) {
    console.error("[waitlist] saveSignup failed:", err);
    return { ok: false, error: "storage_failed" };
  }
}
