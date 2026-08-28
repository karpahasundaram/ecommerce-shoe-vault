import { createClient } from "@/lib/supabase/server";
import type {
  CartLine,
  Category,
  ProductCardData,
  ProductWithRelations,
} from "@/lib/types";
import type { SortValue } from "@/lib/constants";
import type { PostgrestError } from "@supabase/supabase-js";

const CARD_SELECT =
  "*, category:categories(slug,name), images:product_images(url,alt), variants:product_variants(stock_quantity)";

export interface ProductQuery {
  categorySlug?: string;
  sort?: SortValue;
  minPrice?: number;
  maxPrice?: number;
  size?: string; // only products with stock in this size
}

/**
 * Log Supabase errors instead of swallowing them. A common cause of an
 * "empty store" in production is that supabase/schema.sql was never run
 * (PostgREST then returns PGRST205 "Could not find the table ..."), or the
 * NEXT_PUBLIC_SUPABASE_* env vars point at the wrong project. Those show up
 * here in the server logs (Vercel → Deployments → Functions / Logs).
 */
function logDbError(context: string, error: PostgrestError | null) {
  if (!error) return;
  console.error(
    `[shoe-vault] DB query failed (${context}): ${error.code ?? ""} ${error.message}` +
      (error.code === "PGRST205"
        ? " — run supabase/schema.sql in the Supabase SQL editor (see SETUP.md)."
        : ""),
  );
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  logDbError("getCategories", error);
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  logDbError("getCategoryBySlug", error);
  return data;
}

export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductCardData[]> {
  const supabase = await createClient();
  let q = supabase.from("products").select(CARD_SELECT).eq("is_active", true);

  if (query.categorySlug) {
    const cat = await getCategoryBySlug(query.categorySlug);
    if (!cat) return [];
    q = q.eq("category_id", cat.id);
  }
  if (typeof query.minPrice === "number") q = q.gte("price", query.minPrice);
  if (typeof query.maxPrice === "number") q = q.lte("price", query.maxPrice);

  switch (query.sort) {
    case "price-asc":
      q = q.order("price", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price", { ascending: false });
      break;
    case "name":
      q = q.order("name", { ascending: true });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error } = await q;
  logDbError("getProducts", error);
  let products = (data ?? []) as unknown as ProductCardData[];

  if (query.size) {
    // Needs a variant with stock in the requested size — filter in app code
    // so the join filter doesn't drop the other variants we need for the card.
    const { data: variants, error: vErr } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("size", query.size)
      .gt("stock_quantity", 0);
    logDbError("getProducts:size", vErr);
    const allowed = new Set((variants ?? []).map((v) => v.product_id));
    products = products.filter((p) => allowed.has(p.id));
  }

  return products;
}

export async function getFeaturedProducts(
  limit = 3,
): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  logDbError("getFeaturedProducts", error);
  return (data ?? []) as unknown as ProductCardData[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id,slug,name), images:product_images(*), variants:product_variants(*)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  logDbError("getProductBySlug", error);
  if (!data) return null;

  const product = data as unknown as ProductWithRelations;
  product.images = [...product.images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  product.variants = [...product.variants].sort((a, b) =>
    a.size.localeCompare(b.size, undefined, { numeric: true }),
  );
  return product;
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(limit);
  logDbError("getRelatedProducts", error);
  return (data ?? []) as unknown as ProductCardData[];
}

export async function getCart(): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "*, variant:product_variants(*, product:products(*, images:product_images(url,alt)))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  logDbError("getCart", error);

  return (data ?? []) as unknown as CartLine[];
}

export function cartTotals(lines: CartLine[]) {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce(
    (sum, l) => sum + l.variant.product.price * l.quantity,
    0,
  );
  return { count, subtotal };
}
