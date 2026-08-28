import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Current auth user or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user's profile row (or null if signed out). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

/** Redirects to /login when signed out. Returns the user otherwise. */
export async function requireUser(redirectTo = "/account") {
  const user = await getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  return user;
}

/** Redirects non-admins away. Returns the user otherwise. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  return user;
}
