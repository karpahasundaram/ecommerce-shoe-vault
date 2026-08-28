import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { totalStock } from "@/lib/utils";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGrid } from "@/components/product-card";
import { Badge } from "@/components/ui/misc";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description || `${product.name} — shoe-vault`,
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [user, related] = await Promise.all([
    getUser(),
    getRelatedProducts(product.category.id, product.id, 4),
  ]);
  const inStock = totalStock(product.variants) > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/products" className="hover:text-foreground">
          Shoes
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted">
              {product.category.name}
            </span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-2xl font-semibold">
              {formatINR(product.price)}
            </p>
          </div>

          {!inStock ? (
            <Badge tone="neutral">Sold out</Badge>
          ) : (
            <AddToCart
              variants={product.variants.map((v) => ({
                id: v.id,
                size: v.size,
                stock_quantity: v.stock_quantity,
              }))}
              signedIn={Boolean(user)}
            />
          )}

          {product.description && (
            <div className="mt-2 border-t border-border pt-5">
              <h2 className="text-sm font-semibold">Details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-bold tracking-tight">
            More {product.category.name.toLowerCase()}
          </h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
