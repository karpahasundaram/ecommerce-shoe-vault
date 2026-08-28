"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validation";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveAddress(raw: unknown): Promise<Result> {
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in." };

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const values = parsed.data;
  const makeDefault = values.is_default || (count ?? 0) === 0;

  let id = values.id;

  if (id) {
    const { error } = await supabase
      .from("addresses")
      .update({
        label: values.label || null,
        full_name: values.full_name,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2 || null,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country,
        is_default: makeDefault,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: "Could not save the address." };
  } else {
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label: values.label || null,
        full_name: values.full_name,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2 || null,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country,
        is_default: makeDefault,
      })
      .select("id")
      .single();
    if (error || !data)
      return { ok: false, error: "Could not save the address." };
    id = data.id;
  }

  if (makeDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", id);
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, id: id! };
}

export async function deleteAddress(id: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in." };

  const { data: removed } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("is_default")
    .maybeSingle();

  // If we removed the default, promote the most recent remaining address.
  if (removed?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", next.id);
    }
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, id };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in." };

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not update." };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, id };
}
