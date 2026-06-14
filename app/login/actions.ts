"use server";

import { headers } from "next/headers";

import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LoginState } from "./login-state";

/**
 * Passwordless sign-in: email the user a magic link. We never reveal whether an
 * account exists (to prevent enumeration) — any send issue is logged server-side
 * but the UI always shows "check your inbox". `shouldCreateUser: false` keeps
 * /login sign-in only; accounts are created via the /subscribe checkout.
 *
 * Note: state type + initial state live in ./login-state — a "use server" file
 * may only export async functions.
 */

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return { status: "error", message: "Enter your email to get a sign-in link.", email };
  }
  if (!isValidEmail(email)) {
    return { status: "error", message: "That email doesn't look quite right.", email };
  }

  // No Supabase keys → demo: nothing is sent, but the flow still completes.
  if (!isSupabaseConfigured()) {
    console.info("[login] magic link (demo — Supabase not configured)", { email });
    return { status: "sent", email, demo: true };
  }

  const h = await headers();
  const host = h.get("host");
  const origin = h.get("origin") ?? (host ? `https://${host}` : undefined);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  // Log real failures, but always report "sent" so the response can't be used to
  // tell whether an account exists.
  if (error) console.error("[login] signInWithOtp failed", error.message);

  return { status: "sent", email, demo: false };
}
