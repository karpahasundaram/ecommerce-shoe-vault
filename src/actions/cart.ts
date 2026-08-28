"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function addToCart(input: {
  variantId: string;
  quantity?: number;
}): Promise<Result> {
  const qty = Math.max(1, Math.floor(input.quantity ?? 1));
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Please log in to add items." };

  const supabase = await createClient();

  const { data: variant } = await supabase
    .from("product_variants")
    .select("id, stock_quantity")
    .eq("id", input.variantId)
    .maybeSingle();
  if (!variant) return { ok: false, error: "That size is unavailable." };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("variant_id", input.variantId)
    .maybeSingle();

  const nextQty = (existing?.quantity ?? 0) + qty;
  if (nextQty > variant.stock_quantity) {
    return {
      ok: false,
      error:
        variant.stock_quantity === 0
          ? "This size is sold out."
          : `Only ${variant.stock_quantity} left in this size.`,
    };
  }

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Could not update your cart." };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      user_id: userId,
      variant_id: input.variantId,
      quantity: qty,
    });
    if (error) return { ok: false, error: "Could not add to your cart." };
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItem(input: {
  itemId: string;
  quantity: number;
}): Promise<Result> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Please log in." };
  const supabase = await createClient();

  const qty = Math.floor(input.quantity);

  const { data: item } = await supabase
    .from("cart_items")
    .select("id, variant:product_variants(stock_quantity)")
    .eq("id", input.itemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return { ok: false, error: "Item not found." };

  if (qty <= 0) {
    await supabase.from("cart_items").delete().eq("id", input.itemId);
  } else {
    const stock =
      (item.variant as unknown as { stock_quantity: number }).stock_quantity ??
      0;
    if (qty > stock) return { ok: false, error: `Only ${stock} available.` };
    await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("id", input.itemId);
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<Result> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Please log in." };
  const supabase = await createClient();
  await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}
