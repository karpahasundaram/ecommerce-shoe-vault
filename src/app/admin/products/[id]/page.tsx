import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { buttonClasses } from "@/components/ui/button";
import type { ProductImage, ProductVariant } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  const images = [
    ...((product.images as unknown as ProductImage[]) ?? []),
  ].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  const variants = ((product.variants as unknown as ProductVariant[]) ?? []).map(
    (v) => ({
    size: v.size,
    stock_quantity: v.stock_quantity,
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Products
          </Link>
          <Link
            href={`/products/${product.slug}`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            View in store →
          </Link>
        </div>
        <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
        <div className="mt-6">
          <ProductForm
            categories={categories ?? []}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              category_id: product.category_id,
              description: product.description,
              price: product.price,
              is_featured: product.is_featured,
              is_active: product.is_active,
              variants,
            }}
          />
        </div>
      </div>

      <div className="lg:pt-10">
        <ImageManager productId={product.id} images={images} />
      </div>
    </div>
  );
}
