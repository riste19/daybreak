"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

/** Sign out (clears the session cookies) and return to /login. */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

/**
 * Cancel the signed-in user's subscription (e.g. during the free trial). Acts as
 * the user via RLS (subscriptions_update_self), so it only ever touches their own
 * row. The daily cron skips cancelled subscriptions, so emails stop.
 */
export async function cancelSubscription(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
