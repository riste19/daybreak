// Next.js 16 Proxy (formerly Middleware). Runs before matched requests; here it
// only keeps the Supabase auth session fresh (see lib/supabase/proxy-session.ts).
// When Supabase isn't configured, updateSession passes the request through.

import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets and image files. Auth routes still
  // need a fresh session, so they are intentionally NOT excluded here.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
