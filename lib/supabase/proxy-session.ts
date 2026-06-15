// Session refresh for the Next.js Proxy (Next 16's renamed Middleware).
//
// On every matched request this touches Supabase auth so an expired access token
// is silently refreshed and the new auth cookies are written onto the response.
// It does NOT do route protection (pages/actions do their own secure checks) —
// keeping the proxy a cheap, cookie-only pass, per the Supabase + Next guidance.

import { createServerClient as createSsrClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase not configured (e.g. local dev) → pass through untouched.
  if (!url || !anonKey) return response;

  const supabase = createSsrClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token and triggers cookie refresh.
  // Do not run code between client creation and this call.
  await supabase.auth.getUser();

  return response;
}
