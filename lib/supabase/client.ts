// Supabase client setup for Next.js (browser + server-side).
//
// Both clients are created LAZILY, so importing this module never throws when
// the environment isn't configured (e.g. local dev without a Supabase project).
// They only throw — with a clear message — the moment you actually try to use
// them without the required env vars. Call the `isSupabase*Configured()` guards
// first to take a graceful path instead.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type DbClient = SupabaseClient<Database>;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function supabaseUrl(): string | undefined {
  // NEXT_PUBLIC_ is exposed to the browser; SUPABASE_URL is a server-only alias.
  return readEnv('NEXT_PUBLIC_SUPABASE_URL') ?? readEnv('SUPABASE_URL');
}

/** True when the public (browser, RLS-respecting) client can be used. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}

/** True when privileged server-side operations (service role) are possible. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl() && readEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

let browserClient: DbClient | null = null;

/** Browser/anon client (respects RLS). Memoized after first use. */
export function getSupabaseClient(): DbClient {
  const url = supabaseUrl();
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return (browserClient ??= createClient<Database>(url, anonKey));
}

let serverClient: DbClient | null = null;

/**
 * Server-side client (service role key, bypasses RLS). Server-only — never
 * import where it could reach the browser bundle. Memoized after first use.
 */
export function createServerClient(): DbClient {
  const url = supabaseUrl();
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY (and a Supabase URL) for server operations.',
    );
  }
  return (serverClient ??= createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

/**
 * Anon client as a lazy proxy: existing callers can keep using `supabase.from(…)`
 * unchanged, but the underlying client (and its env check) is deferred until the
 * first property access — so merely importing this stays safe without env.
 */
export const supabase: DbClient = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
