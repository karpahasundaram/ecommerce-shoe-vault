"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, ok: Boolean(isAdmin) };
}

type Result =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertProduct(raw: unknown): Promise<Result> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form fields.",
    };
  }
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "Admins only." };

  const v = parsed.data;
  let productId = v.id;

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update({
        name: v.name,
        slug: v.slug,
        category_id: v.category_id,
        description: v.description ?? "",
        price: v.price,
        is_featured: v.is_featured ?? false,
        is_active: v.is_active ?? true,
      })
      .eq("id", productId);
    if (error)
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "That slug is already used by another product."
            : "Could not save the product.",
      };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: v.name,
        slug: v.slug,
        category_id: v.category_id,
        description: v.description ?? "",
        price: v.price,
        is_featured: v.is_featured ?? false,
        is_active: v.is_active ?? true,
      })
      .select("id")
      .single();
    if (error || !data)
      return {
        ok: false,
        error:
          error?.code === "23505"
            ? "That slug is already in use."
            : "Could not create the product.",
      };
    productId = data.id;
  }

  // Reconcile variants: upsert the given sizes, delete the ones removed in the form.
  const keepSizes = new Set(v.variants.map((x) => x.size));
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id, size")
    .eq("product_id", productId);

  const toDelete = (existingVariants ?? [])
    .filter((row) => !keepSizes.has(row.size))
    .map((row) => row.id);
  if (toDelete.length > 0) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }

  for (const variant of v.variants) {
    await supabase.from("product_variants").upsert(
      {
        product_id: productId,
        size: variant.size,
        stock_quantity: variant.stock_quantity,
      },
      { onConflict: "product_id,size" },
    );
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  revalidatePath(`/products/${v.slug}`);
  return { ok: true, id: productId! };
}

export async function deleteProduct(id: string): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "Admins only." };
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the product." };
  revalidatePath("/admin");
  revalidatePath("/products");
  return { ok: true, id };
}

export async function addProductImage(formData: FormData): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "Admins only." };

  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "");
  if (!productId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 5 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: "Upload failed." };

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      alt: alt || null,
      position: count ?? 0,
      is_primary: (count ?? 0) === 0,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not save the image." };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true, id: data.id };
}

export async function deleteProductImage(
  imageId: string,
  productId: string,
): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "Admins only." };

  const { data: img } = await supabase
    .from("product_images")
    .select("url, is_primary")
    .eq("id", imageId)
    .maybeSingle();

  await supabase.from("product_images").delete().eq("id", imageId);

  if (img?.url) {
    const marker = "/product-images/";
    const idx = img.url.indexOf(marker);
    if (idx !== -1) {
      const path = img.url.slice(idx + marker.length);
      await supabase.storage.from("product-images").remove([path]);
    }
  }

  if (img?.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next)
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", next.id);
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true, id: imageId };
}

export async function setPrimaryImage(
  imageId: string,
  productId: string,
): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "Admins only." };
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true, id: imageId };
}
