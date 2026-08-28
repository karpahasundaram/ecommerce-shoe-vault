"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";

export async function updateProfile(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Could not update your profile." };

  revalidatePath("/account");
  return { ok: true };
}
