import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Magic-link / OAuth callback. Supabase redirects here with a one-time `code`;
 * we exchange it for a session (which sets the auth cookies via the SSR client)
 * and forward the user on. On any failure we bounce to /login with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow same-origin relative redirects to avoid an open-redirect.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth/callback] code exchange failed", error.message);
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
