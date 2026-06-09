import { NextResponse } from "next/server";

import { saveSignup } from "@/lib/storage";
import {
  isValidEmail,
  normalizeEmail,
  sanitizeNote,
  NOTE_MAX_LENGTH,
} from "@/lib/validation";

// Touches the filesystem in dev — keep on the Node.js runtime, not Edge.
export const runtime = "nodejs";

interface WaitlistBody {
  email?: unknown;
  note?: unknown;
  /** Honeypot: real users never see or fill this; bots often do. */
  company?: unknown;
}

export async function POST(request: Request) {
  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  // Honeypot tripped → pretend success so bots don't learn anything.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, message: "You're on the list." });
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const note = sanitizeNote(body.note);
  if (note.length > NOTE_MAX_LENGTH) {
    return NextResponse.json(
      { ok: false, error: "That note is a little too long." },
      { status: 400 },
    );
  }

  const result = await saveSignup(email, note || undefined);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong saving your spot. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    duplicate: result.duplicate,
    message: result.duplicate
      ? "You're already on the list — see you at dawn."
      : "You're on the list — we'll be in touch.",
  });
}
