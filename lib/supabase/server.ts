// Session-scoped Supabase access for Server Components, Server Actions, and
// Route Handlers. Uses the anon key + the request's cookies via @supabase/ssr,
// so it acts AS the logged-in user and Row-Level Security applies.
//
// Distinct from lib/supabase/client.ts, whose `createServerClient` is the
// service-role admin client (bypasses RLS) used for provisioning.

import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import type { User as AuthUser } from "@supabase/supabase-js";

import type { Database } from "./types";
import { isSupabaseConfigured } from "./client";

/**
 * A Supabase client bound to the current request's cookies (RLS-scoped to the
 * signed-in user). Server-only. Throws if Supabase isn't configured — guard with
 * `isSupabaseConfigured()` first.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  const cookieStore = await cookies();
  return createSsrClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where the cookie store is read-only.
          // Safe to ignore — the proxy refreshes the session cookie on the next
          // request (see lib/supabase/proxy-session.ts).
        }
      },
    },
  });
}

/**
 * The current authenticated Supabase user, or `null`. Memoized per render pass.
 * Never throws: returns `null` when Supabase isn't configured or there's no
 * valid session. This is the DAL entry point — call it before reading user data.
 */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

/** Convenience: is there a signed-in user this request? (memoized via getSessionUser) */
export async function isLoggedIn(): Promise<boolean> {
  return Boolean(await getSessionUser());
}
